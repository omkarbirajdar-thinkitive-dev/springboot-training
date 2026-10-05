package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.service.GreetingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/greetings")
public class GreetingRestController {

    private final GreetingService greetingService;

    public GreetingRestController(GreetingService greetingService) {
        this.greetingService = greetingService;
    }

    @GetMapping("/hello")
    public String sayHello(@RequestParam(defaultValue = "World") String name) {
        return greetingService.getPersonalizedGreeting(name);
    }

    @PostMapping
    public String createGreeting(@RequestParam String message,
                                 @RequestParam(defaultValue = "general") String type) {
        return greetingService.createGreeting(message, type);
    }

    @GetMapping
    public List<String> getAllGreetings() {
        return greetingService.getAllGreetings();
    }

    @GetMapping("/{id}")
    public String getGreetingById(@PathVariable Long id) {
        return greetingService.getGreetingById(id);
    }
}
