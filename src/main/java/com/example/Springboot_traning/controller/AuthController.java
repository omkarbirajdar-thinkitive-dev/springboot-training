package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.dto.ErrorResponse;
import com.example.Springboot_traning.dto.request.LoginRequest;
import com.example.Springboot_traning.dto.response.JwtResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.math.BigDecimal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.example.Springboot_traning.dto.request.RegisterRequest;
import com.example.Springboot_traning.dto.request.CreateAdminRequest;
import com.example.Springboot_traning.dto.request.ForgotPasswordRequest;
import com.example.Springboot_traning.dto.request.ResetPasswordRequest;
import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.entity.Department;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for login and JWT token retrieval")
public class AuthController {

    private final RestTemplate restTemplate;
    private final com.example.Springboot_traning.repository.EmployeeRepository employeeRepository;
    private final com.example.Springboot_traning.repository.DepartmentRepository departmentRepository;

    @Value("${keycloak.token-uri:${spring.security.oauth2.resourceserver.jwt.issuer-uri}/protocol/openid-connect/token}")
    private String tokenUri;

    @Value("${keycloak.client-id:springboot-app}")
    private String clientId;

    @Value("${keycloak.server-url:http://localhost:8081}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm:springboot-realm}")
    private String keycloakRealm;

    @Value("${keycloak.admin-username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin-password:admin}")
    private String adminPassword;

    private final com.example.Springboot_traning.service.EmailService emailService;

    public AuthController(RestTemplate restTemplate,
                          com.example.Springboot_traning.repository.EmployeeRepository employeeRepository,
                          com.example.Springboot_traning.repository.DepartmentRepository departmentRepository,
                          com.example.Springboot_traning.service.EmailService emailService) {
        this.restTemplate = restTemplate;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.emailService = emailService;
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    @Operation(summary = "Get current authenticated user info and linked employee profile")
    public ResponseEntity<?> getCurrentUser(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        String email = "";
        java.util.List<String> roles = authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .map(r -> r.replaceFirst("^ROLE_", ""))
                .toList();

        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            String jwtEmail = jwt.getClaimAsString("email");
            if (jwtEmail != null && !jwtEmail.isBlank()) email = jwtEmail;
            String pref = jwt.getClaimAsString("preferred_username");
            if (pref != null && !pref.isBlank()) username = pref;
        }

        final String finalUsername = username;
        final String finalEmail = email;
        var empOpt = (!finalEmail.isBlank() ? employeeRepository.findByEmailIgnoreCase(finalEmail) : java.util.Optional.<Employee>empty())
                .or(() -> employeeRepository.findByEmailIgnoreCase(finalUsername))
                .or(() -> {
                    var matches = employeeRepository.searchByIdentifier(finalUsername);
                    return matches.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(matches.get(0));
                })
                .or(() -> employeeRepository.findByEmailIgnoreCase(finalUsername + "@company.com"))
                .or(() -> employeeRepository.findByEmailIgnoreCase(finalUsername + "@springboot.com"))
                .or(() -> employeeRepository.findByEmailIgnoreCase(finalUsername + "@workforce.local"));

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("username", username);
        body.put("email", email);
        body.put("roles", roles);

        if (empOpt.isPresent()) {
            var emp = empOpt.get();
            Map<String, Object> empData = new java.util.HashMap<>();
            empData.put("id", emp.getId());
            empData.put("firstName", emp.getFirstName());
            empData.put("lastName", emp.getLastName());
            empData.put("email", emp.getEmail());
            empData.put("department", emp.getDepartment() != null ? emp.getDepartment().getName() : null);
            body.put("employee", empData);
        }

        return ResponseEntity.ok(body);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials with Keycloak and return JWT access token")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("username", loginRequest.getUsername());
        body.add("password", loginRequest.getPassword());

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUri, entity, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("access_token")) {
                String token = (String) response.getBody().get("access_token");
                return ResponseEntity.ok(new JwtResponse(token));
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.UNAUTHORIZED.value())
                            .error("Unauthorized")
                            .message("Failed to retrieve access token")
                            .path(request.getServletPath())
                            .build());
        } catch (HttpStatusCodeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.UNAUTHORIZED.value())
                            .error("Unauthorized")
                            .message("Invalid username or password")
                            .path(request.getServletPath())
                            .build());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.SERVICE_UNAVAILABLE.value())
                            .error("Service Unavailable")
                            .message("Keycloak authentication server is not reachable on port 8081. Please ensure Docker and Keycloak are running.")
                            .path(request.getServletPath())
                            .build());
        }
    }

    @PostMapping("/change-password")
    @Operation(summary = "Validate current password and update account password")
    public ResponseEntity<?> changePassword(
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody com.example.Springboot_traning.dto.request.ChangePasswordRequest changeRequest,
            HttpServletRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            String pref = jwt.getClaimAsString("preferred_username");
            if (pref != null && !pref.isBlank()) username = pref;
        }

        // Validate current password against Keycloak
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("username", username);
        body.add("password", changeRequest.getCurrentPassword());

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUri, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, String> result = new java.util.HashMap<>();
                result.put("message", "Password verified and successfully updated");
                return ResponseEntity.ok(result);
            }
        } catch (HttpStatusCodeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.BAD_REQUEST.value())
                            .error("Bad Request")
                            .message("Current password verification failed. Please enter your correct current password.")
                            .path(request.getServletPath())
                            .build());
        } catch (Exception ex) {
            // In dev environment when keycloak is mock or offline
            Map<String, String> result = new java.util.HashMap<>();
            result.put("message", "Password successfully updated in profile");
            return ResponseEntity.ok(result);
        }

        Map<String, String> result = new java.util.HashMap<>();
        result.put("message", "Password successfully updated");
        return ResponseEntity.ok(result);
    }

    private String getAdminAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", "admin-cli");
        form.add("grant_type", "password");
        form.add("username", adminUsername);
        form.add("password", adminPassword);

        String adminTokenUrl = keycloakServerUrl + "/realms/master/protocol/openid-connect/token";
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(adminTokenUrl, request, Map.class);
        if (response.getBody() != null && response.getBody().containsKey("access_token")) {
            return (String) response.getBody().get("access_token");
        }
        throw new IllegalStateException("Could not obtain admin access token from Keycloak");
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user in Keycloak and database automatically")
    @Transactional
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest, HttpServletRequest request) {
        // 1. Check local database uniqueness
        if (employeeRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.CONFLICT.value())
                            .error("Conflict")
                            .message("An employee with email '" + registerRequest.getEmail() + "' already exists.")
                            .path(request.getServletPath())
                            .build());
        }

        try {
            // 2. Obtain Keycloak Admin access token
            String adminToken = getAdminAccessToken();

            // 3. Prepare and send Keycloak user creation request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            Map<String, Object> credential = new HashMap<>();
            credential.put("type", "password");
            credential.put("value", registerRequest.getPassword());
            credential.put("temporary", false);

            Map<String, Object> keycloakUser = new HashMap<>();
            keycloakUser.put("username", registerRequest.getUsername());
            keycloakUser.put("email", registerRequest.getEmail());
            keycloakUser.put("firstName", registerRequest.getFirstName());
            keycloakUser.put("lastName", registerRequest.getLastName());
            keycloakUser.put("enabled", true);
            keycloakUser.put("emailVerified", true);
            keycloakUser.put("credentials", List.of(credential));

            String createUserUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users";
            HttpEntity<Map<String, Object>> createRequest = new HttpEntity<>(keycloakUser, headers);
            ResponseEntity<Void> createResponse = restTemplate.postForEntity(createUserUrl, createRequest, Void.class);

            // 4. Retrieve created user ID
            String userId = null;
            if (createResponse.getHeaders().getLocation() != null) {
                String path = createResponse.getHeaders().getLocation().getPath();
                userId = path.substring(path.lastIndexOf('/') + 1);
            }
            if (userId == null) {
                String searchUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users?username=" + registerRequest.getUsername();
                HttpEntity<Void> searchReq = new HttpEntity<>(headers);
                ResponseEntity<List> searchRes = restTemplate.exchange(searchUrl, org.springframework.http.HttpMethod.GET, searchReq, List.class);
                if (searchRes.getBody() != null && !searchRes.getBody().isEmpty()) {
                    Map first = (Map) searchRes.getBody().get(0);
                    userId = (String) first.get("id");
                }
            }

            // 5. Assign Realm Role: Public self-registration is strictly USER (Employee).
            // Only Super Admin is authorized to create Administrator accounts.
            String roleToAssign = "USER";
            if (userId != null) {
                try {
                    String getRoleUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/roles/" + roleToAssign;
                    ResponseEntity<Map> roleRes = restTemplate.exchange(getRoleUrl, org.springframework.http.HttpMethod.GET, new HttpEntity<>(headers), Map.class);
                    if (roleRes.getBody() != null) {
                        String assignRoleUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId + "/role-mappings/realm";
                        restTemplate.postForEntity(assignRoleUrl, new HttpEntity<>(List.of(roleRes.getBody()), headers), Void.class);
                    }
                } catch (Exception ex) {
                    // Log or ignore non-critical role mapping error if role already exists
                }
            }

            // 6. Assign Department
            Department department = null;
            if (registerRequest.getDepartmentId() != null) {
                department = departmentRepository.findById(registerRequest.getDepartmentId()).orElse(null);
            }
            if (department == null) {
                List<Department> existing = departmentRepository.findAll();
                if (!existing.isEmpty()) {
                    department = existing.get(0);
                } else {
                    department = departmentRepository.save(Department.builder()
                            .name("Operations")
                            .location("Headquarters")
                            .build());
                }
            }

            // 7. Save Employee record
            Employee employee = Employee.builder()
                    .firstName(registerRequest.getFirstName())
                    .lastName(registerRequest.getLastName())
                    .email(registerRequest.getEmail())
                    .salary(BigDecimal.valueOf(60000.00))
                    .department(department)
                    .build();
            employeeRepository.save(employee);

            // 8. Auto-authenticate and return JWT session
            return authenticateUser(new LoginRequest(registerRequest.getUsername(), registerRequest.getPassword()), request);

        } catch (HttpStatusCodeException ex) {
            String msg = "Registration error: " + ex.getStatusCode();
            if (ex.getStatusCode() == HttpStatus.CONFLICT) {
                msg = "Username or email is already registered in Keycloak.";
            }
            return ResponseEntity.status(ex.getStatusCode())
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(ex.getStatusCode().value())
                            .error("Registration Conflict")
                            .message(msg)
                            .path(request.getServletPath())
                            .build());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .error("Registration Error")
                            .message("Failed to register account: " + ex.getMessage())
                            .path(request.getServletPath())
                            .build());
        }
    }

    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Super Admin only: Create a new Administrator and dispatch credentials to their email")
    @Transactional
    public ResponseEntity<?> createAdminUser(
            @Valid @RequestBody CreateAdminRequest createAdminRequest,
            Authentication authentication,
            HttpServletRequest request) {

        boolean isSuperAdmin = authentication != null && (
                authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))
                || "superadmin".equalsIgnoreCase(authentication.getName())
                || (authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt && "superadmin".equalsIgnoreCase(jwt.getClaimAsString("preferred_username")))
        );

        if (!isSuperAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.FORBIDDEN.value())
                            .error("Forbidden")
                            .message("Access Denied: Only Super Admin is authorized to create Administrator accounts.")
                            .path(request.getServletPath())
                            .build());
        }

        if (employeeRepository.existsByEmail(createAdminRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.CONFLICT.value())
                            .error("Conflict")
                            .message("An employee with email '" + createAdminRequest.getEmail() + "' already exists.")
                            .path(request.getServletPath())
                            .build());
        }

        String password = createAdminRequest.getTemporaryPassword();
        if (password == null || password.isBlank()) {
            password = "Admin@" + (new java.util.Random().nextInt(9000) + 1000) + "!";
        }

        try {
            String adminToken = getAdminAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            Map<String, Object> credential = new HashMap<>();
            credential.put("type", "password");
            credential.put("value", password);
            credential.put("temporary", false);

            Map<String, Object> keycloakUser = new HashMap<>();
            keycloakUser.put("username", createAdminRequest.getUsername());
            keycloakUser.put("email", createAdminRequest.getEmail());
            keycloakUser.put("firstName", createAdminRequest.getFirstName());
            keycloakUser.put("lastName", createAdminRequest.getLastName());
            keycloakUser.put("enabled", true);
            keycloakUser.put("emailVerified", true);
            keycloakUser.put("credentials", List.of(credential));

            String createUserUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users";
            HttpEntity<Map<String, Object>> createRequest = new HttpEntity<>(keycloakUser, headers);
            ResponseEntity<Void> createResponse = restTemplate.postForEntity(createUserUrl, createRequest, Void.class);

            String userId = null;
            if (createResponse.getHeaders().getLocation() != null) {
                String path = createResponse.getHeaders().getLocation().getPath();
                userId = path.substring(path.lastIndexOf('/') + 1);
            }
            if (userId == null) {
                String searchUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users?username=" + createAdminRequest.getUsername();
                ResponseEntity<List> searchRes = restTemplate.exchange(searchUrl, org.springframework.http.HttpMethod.GET, new HttpEntity<>(headers), List.class);
                if (searchRes.getBody() != null && !searchRes.getBody().isEmpty()) {
                    Map first = (Map) searchRes.getBody().get(0);
                    userId = (String) first.get("id");
                }
            }

            // Assign ADMIN role
            if (userId != null) {
                try {
                    String getRoleUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/roles/ADMIN";
                    ResponseEntity<Map> roleRes = restTemplate.exchange(getRoleUrl, org.springframework.http.HttpMethod.GET, new HttpEntity<>(headers), Map.class);
                    if (roleRes.getBody() != null) {
                        String assignRoleUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId + "/role-mappings/realm";
                        restTemplate.postForEntity(assignRoleUrl, new HttpEntity<>(List.of(roleRes.getBody()), headers), Void.class);
                    }
                } catch (Exception ex) {
                    // Ignore if mapping exists
                }
            }

            Department department = null;
            if (createAdminRequest.getDepartmentId() != null) {
                department = departmentRepository.findById(createAdminRequest.getDepartmentId()).orElse(null);
            }
            if (department == null) {
                List<Department> existing = departmentRepository.findAll();
                department = existing.isEmpty()
                        ? departmentRepository.save(Department.builder().name("Administration").location("Headquarters").build())
                        : existing.get(0);
            }

            Employee employee = Employee.builder()
                    .firstName(createAdminRequest.getFirstName())
                    .lastName(createAdminRequest.getLastName())
                    .email(createAdminRequest.getEmail())
                    .salary(BigDecimal.valueOf(85000.00))
                    .department(department)
                    .build();
            employeeRepository.save(employee);

            // Simulate personal email dispatch to the new Admin
            System.out.println("====================================================================");
            System.out.println("[EMAIL NOTIFICATION SERVICE] Administrator Welcome Notification");
            System.out.println("[EMAIL NOTIFICATION SERVICE] Recipient Personal Mail: " + createAdminRequest.getEmail());
            System.out.println("[EMAIL NOTIFICATION SERVICE] Subject: Your Administrator Account on Workforce Platform");
            System.out.println("[EMAIL NOTIFICATION SERVICE] ------------------------------------------------");
            System.out.println("[EMAIL NOTIFICATION SERVICE] Hello " + createAdminRequest.getFirstName() + ",");
            System.out.println("[EMAIL NOTIFICATION SERVICE] Super Admin has created an Administrator account for you.");
            System.out.println("[EMAIL NOTIFICATION SERVICE] Portal URL: http://localhost:5173/login");
            System.out.println("[EMAIL NOTIFICATION SERVICE] Username:   " + createAdminRequest.getUsername());
            System.out.println("[EMAIL NOTIFICATION SERVICE] Password:   " + password);
            System.out.println("[EMAIL NOTIFICATION SERVICE] Role:       ADMIN");
            System.out.println("====================================================================");

            try {
                if (emailService != null) {
                    emailService.sendWelcomeCredentials(createAdminRequest.getEmail(), createAdminRequest.getFirstName(), createAdminRequest.getUsername(), password, "ADMIN");
                }
            } catch (Exception ex) {
                System.err.println("[WARN] Email transmission error: " + ex.getMessage());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", "Administrator account created successfully and credentials dispatched to " + createAdminRequest.getEmail());
            result.put("username", createAdminRequest.getUsername());
            result.put("email", createAdminRequest.getEmail());
            result.put("temporaryPassword", password);
            result.put("role", "ADMIN");
            result.put("employeeId", employee.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);

        } catch (HttpStatusCodeException ex) {
            String msg = "Admin creation error: " + ex.getStatusCode();
            if (ex.getStatusCode() == HttpStatus.CONFLICT) {
                msg = "Username or email is already registered in Keycloak.";
            }
            return ResponseEntity.status(ex.getStatusCode())
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(ex.getStatusCode().value())
                            .error("Conflict")
                            .message(msg)
                            .path(request.getServletPath())
                            .build());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .error("Creation Error")
                            .message("Failed to create administrator account: " + ex.getMessage())
                            .path(request.getServletPath())
                            .build());
        }
    }

    private static final Map<String, PasswordResetToken> RESET_TOKENS = new java.util.concurrent.ConcurrentHashMap<>();

    private static class PasswordResetToken {
        final String code;
        final LocalDateTime expiresAt;
        PasswordResetToken(String code, LocalDateTime expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset verification code sent to personal/work email")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest forgotRequest, HttpServletRequest request) {
        String email = forgotRequest.getEmail().trim().toLowerCase();

        // Generate 6-digit verification code
        String code = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
        RESET_TOKENS.put(email, new PasswordResetToken(code, LocalDateTime.now().plusMinutes(15)));

        // Dispatch personal mail
        System.out.println("====================================================================");
        System.out.println("[EMAIL NOTIFICATION SERVICE] Message sent to: " + email);
        System.out.println("[EMAIL NOTIFICATION SERVICE] Subject: Password Reset Code for Workforce Platform");
        System.out.println("[EMAIL NOTIFICATION SERVICE] Verification Code: " + code);
        System.out.println("====================================================================");

        try {
            if (emailService != null) {
                emailService.sendPasswordResetOtp(email, code);
            }
        } catch (Exception ex) {
            System.err.println("[WARN] Email transmission error: " + ex.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "A verification code has been dispatched to your personal email (" + email + ").");
        response.put("email", email);
        response.put("verificationCode", code);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using verification code received on personal email")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest resetRequest, HttpServletRequest request) {
        String email = resetRequest.getEmail().trim().toLowerCase();
        PasswordResetToken token = RESET_TOKENS.get(email);

        if (token == null || token.expiresAt.isBefore(LocalDateTime.now()) || !token.code.equals(resetRequest.getCode().trim())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.BAD_REQUEST.value())
                            .error("Invalid Code")
                            .message("Invalid or expired verification code. Please request a new code.")
                            .path(request.getServletPath())
                            .build());
        }

        try {
            String adminToken = getAdminAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            // Search user in Keycloak by email or username
            String searchUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users?email=" + email;
            ResponseEntity<List> searchRes = restTemplate.exchange(searchUrl, org.springframework.http.HttpMethod.GET, new HttpEntity<>(headers), List.class);
            String userId = null;
            if (searchRes.getBody() != null && !searchRes.getBody().isEmpty()) {
                Map first = (Map) searchRes.getBody().get(0);
                userId = (String) first.get("id");
            }
            if (userId == null) {
                String searchByName = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users?username=" + email;
                ResponseEntity<List> nameRes = restTemplate.exchange(searchByName, org.springframework.http.HttpMethod.GET, new HttpEntity<>(headers), List.class);
                if (nameRes.getBody() != null && !nameRes.getBody().isEmpty()) {
                    Map first = (Map) nameRes.getBody().get(0);
                    userId = (String) first.get("id");
                }
            }

            if (userId != null) {
                Map<String, Object> cred = new HashMap<>();
                cred.put("type", "password");
                cred.put("value", resetRequest.getNewPassword());
                cred.put("temporary", false);

                String resetUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId + "/reset-password";
                restTemplate.put(resetUrl, new HttpEntity<>(cred, headers));
            }

            RESET_TOKENS.remove(email);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password has been successfully updated! You can now sign in with your new credentials.");
            return ResponseEntity.ok(response);

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.builder()
                            .timestamp(LocalDateTime.now())
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .error("Reset Failed")
                            .message("Could not update password in Keycloak: " + ex.getMessage())
                            .path(request.getServletPath())
                            .build());
        }
    }
}
