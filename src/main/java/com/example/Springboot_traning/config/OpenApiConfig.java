package com.example.Springboot_traning.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI employeeManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Employee Management REST API")
                        .description("""
                                Spring Boot REST API:
                                Dependency Injection, JPA relationships, REST mappings,
                                global exception handling, Bean Validation, and Swagger/OpenAPI.
                                """)
                        .version("1.0.0")
                        .license(new License()
                                .name("")));
    }
}
