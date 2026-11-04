package com.example.Springboot_traning.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class KeycloakAdminService {

    private final RestTemplate restTemplate;
    private final EmailService emailService;

    @Value("${keycloak.server-url:http://localhost:8081}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm:springboot-realm}")
    private String keycloakRealm;

    @Value("${keycloak.admin-username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin-password:admin}")
    private String adminPassword;

    public KeycloakAdminService(RestTemplate restTemplate, EmailService emailService) {
        this.restTemplate = restTemplate;
        this.emailService = emailService;
    }

    public String getAdminAccessToken() {
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

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void ensureExtendedSessionLifespan() {
        try {
            String adminToken = getAdminAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            Map<String, Object> update = new HashMap<>();
            update.put("accessTokenLifespan", 86400); // 24 hours
            update.put("ssoSessionIdleTimeout", 86400);
            update.put("ssoSessionMaxLifespan", 86400);
            update.put("clientSessionIdleTimeout", 86400);
            update.put("clientSessionMaxLifespan", 86400);

            String realmUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm;
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(update, headers);
            restTemplate.exchange(realmUrl, HttpMethod.PUT, request, Void.class);
            System.out.println("[INFO] Keycloak realm session lifespan verified & configured to 24 hours (86400s).");
        } catch (Exception ex) {
            System.err.println("[WARN] Could not auto-sync Keycloak token lifespan: " + ex.getMessage());
        }
    }

    public String provisionUser(String username, String email, String firstName, String lastName, String password, String role) {
        String adminToken = getAdminAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> credential = new HashMap<>();
        credential.put("type", "password");
        credential.put("value", password);
        credential.put("temporary", false);

        Map<String, Object> keycloakUser = new HashMap<>();
        keycloakUser.put("username", username);
        keycloakUser.put("email", email);
        keycloakUser.put("firstName", firstName);
        keycloakUser.put("lastName", lastName);
        keycloakUser.put("enabled", true);
        keycloakUser.put("emailVerified", true);
        keycloakUser.put("credentials", List.of(credential));

        String createUserUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users";
        HttpEntity<Map<String, Object>> createRequest = new HttpEntity<>(keycloakUser, headers);

        try {
            ResponseEntity<Void> createResponse = restTemplate.postForEntity(createUserUrl, createRequest, Void.class);

            String userId = null;
            if (createResponse.getHeaders().getLocation() != null) {
                String path = createResponse.getHeaders().getLocation().getPath();
                userId = path.substring(path.lastIndexOf('/') + 1);
            }
            if (userId == null) {
                userId = findUserIdByUsernameOrEmail(username, email, headers);
            }

            if (userId != null && role != null && !role.isBlank()) {
                assignRoleToUser(userId, role, headers);
            }

            dispatchWelcomeEmail(email, firstName, username, password, role);
            return userId;

        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode() == HttpStatus.CONFLICT) {
                // User already exists in Keycloak
                return findUserIdByUsernameOrEmail(username, email, headers);
            }
            throw ex;
        }
    }

    public void resetUserPassword(String emailOrUsername, String newPassword) {
        String adminToken = getAdminAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        String userId = findUserIdByUsernameOrEmail(emailOrUsername, emailOrUsername, headers);
        if (userId != null) {
            Map<String, Object> cred = new HashMap<>();
            cred.put("type", "password");
            cred.put("value", newPassword);
            cred.put("temporary", false);

            String resetUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId + "/reset-password";
            restTemplate.put(resetUrl, new HttpEntity<>(cred, headers));
        }
    }

    public String findUserIdByUsernameOrEmail(String username, String email, HttpHeaders headers) {
        try {
            String searchUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users?email=" + email;
            ResponseEntity<List> searchRes = restTemplate.exchange(searchUrl, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            if (searchRes.getBody() != null && !searchRes.getBody().isEmpty()) {
                Map first = (Map) searchRes.getBody().get(0);
                return (String) first.get("id");
            }

            searchUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users?username=" + username;
            searchRes = restTemplate.exchange(searchUrl, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            if (searchRes.getBody() != null && !searchRes.getBody().isEmpty()) {
                Map first = (Map) searchRes.getBody().get(0);
                return (String) first.get("id");
            }
        } catch (Exception ignored) {}
        return null;
    }

    private void assignRoleToUser(String userId, String roleName, HttpHeaders headers) {
        try {
            String getRoleUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/roles/" + roleName;
            ResponseEntity<Map> roleRes = restTemplate.exchange(getRoleUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            if (roleRes.getBody() != null) {
                String assignRoleUrl = keycloakServerUrl + "/admin/realms/" + keycloakRealm + "/users/" + userId + "/role-mappings/realm";
                restTemplate.postForEntity(assignRoleUrl, new HttpEntity<>(List.of(roleRes.getBody()), headers), Void.class);
            }
        } catch (Exception ignored) {}
    }

    public void dispatchWelcomeEmail(String email, String firstName, String username, String password, String role) {
        System.out.println("====================================================================");
        System.out.println("[EMAIL NOTIFICATION SERVICE] New Account Welcome Notification");
        System.out.println("[EMAIL NOTIFICATION SERVICE] Recipient Personal Email: " + email);
        System.out.println("[EMAIL NOTIFICATION SERVICE] Subject: Welcome to Workforce Platform - Your Login Credentials");
        System.out.println("[EMAIL NOTIFICATION SERVICE] ------------------------------------------------");
        System.out.println("[EMAIL NOTIFICATION SERVICE] Hello " + firstName + ",");
        System.out.println("[EMAIL NOTIFICATION SERVICE] An account has been created for you on the Workforce Platform.");
        System.out.println("[EMAIL NOTIFICATION SERVICE] Portal URL: http://localhost:5173/login");
        System.out.println("[EMAIL NOTIFICATION SERVICE] Username:   " + username);
        System.out.println("[EMAIL NOTIFICATION SERVICE] Password:   " + password);
        System.out.println("[EMAIL NOTIFICATION SERVICE] Role:       " + (role != null ? role : "USER"));
        System.out.println("====================================================================");

        try {
            if (emailService != null) {
                emailService.sendWelcomeCredentials(email, firstName, username, password, role);
            }
        } catch (Exception ex) {
            System.err.println("[WARN] Email delivery encounter error: " + ex.getMessage());
        }
    }
}
