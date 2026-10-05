# Spring Boot Training: Employee Management API

This project demonstrates core Spring Boot concepts by building a robust Employee Management REST API.

## 🚀 How to Run

1. Open a terminal in the `Springboot_traning` folder.
2. Run the application using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
3. The app starts on port **8080** using the `dev` profile.

### Important URLs
- **Swagger UI (API Docs):** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **H2 Database Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
  - _JDBC URL:_ `jdbc:h2:mem:empdb`
  - _Username:_ `sa`
  - _Password:_ (leave blank)

## 📚 Concepts Covered & Where to Find Them

| Concept | File / Package | Description |
|---|---|---|
| **Dependency Injection (@Bean)** | `config/ModelMapperConfig.java` | Global `ModelMapper` configuration bean. |
| **Constructor Injection** | `service/impl/EmployeeServiceImpl.java` | Best practice: immutable fields, easy to mock. |
| **Field Injection (Bad Practice)** | `util/FieldInjectionDemo.java` | Example showing why `@Autowired` on fields is bad. |
| **Stereotypes (@Service, @Repository)** | `service/impl/*`, `repository/*` | Component scanning and exception translation. |
| **REST Mappings & Params** | `controller/EmployeeController.java` | `@GetMapping`, `@PostMapping`, `@PathVariable`, `@RequestParam`. |
| **JPA (@Entity, @Table, @Id)** | `entity/Department.java` | Maps classes to DB tables with generated IDs. |
| **JPA Relationships** | `entity/Employee.java` | `@ManyToOne` (Department), `@OneToOne` (Profile). |
| **Profiles & Config** | `src/main/resources/` | `application.properties` (base), `application-dev.properties` (H2), `application-prod.properties` (MySQL). |
| **Global Exception Handling** | `exception/GlobalExceptionHandler.java` | Centralized `@RestControllerAdvice` mapping exceptions to standard `ErrorResponse`. |
| **Validation (@Valid)** | `dto/request/CreateEmployeeRequest.java` | `@NotBlank`, `@Size`, `@Positive`, `@Email` preventing bad data. |
| **OpenAPI / Swagger** | `config/OpenApiConfig.java` | Auto-generates API documentation UI. |
| **Seeding Data** | `DataLoader.java` | `CommandLineRunner` populating DB on startup (only in `dev` profile). |

## 🛠️ Sample JSON Requests

### Create Department (POST `/api/departments`)
```json
{
  "name": "Engineering",
  "location": "Pune, India"
}
```

### Create Employee (POST `/api/employees`)
```json
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul.sharma@example.com",
  "salary": 95000.00,
  "departmentId": 1
}
```

### Create Employee Profile (POST `/api/employees/1/profile`)
```json
{
  "phone": "+91-9876543210",
  "address": "Baner, Pune",
  "dateOfBirth": "1995-08-15"
}
```
