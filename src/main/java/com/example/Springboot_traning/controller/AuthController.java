package com.example.Springboot_traning.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Deprecated
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication (Deprecated)", description = "Legacy login endpoint - use Keycloak token endpoint instead")
public class AuthController {
}
