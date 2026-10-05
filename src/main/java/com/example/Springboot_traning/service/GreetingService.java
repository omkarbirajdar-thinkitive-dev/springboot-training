package com.example.Springboot_traning.service;

import com.example.Springboot_traning.repository.GreetingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GreetingService {

    private final GreetingRepository greetingRepository;

    public GreetingService(GreetingRepository greetingRepository) {
        this.greetingRepository = greetingRepository;
    }

    public String getPersonalizedGreeting(String name) {
        return "Hello, " + name + "!";
    }

    public String createGreeting(String message, String type) {
        String greeting = "[" + type + "] " + message;
        return greetingRepository.save(greeting);
    }

    public List<String> getAllGreetings() {
        return greetingRepository.findAll();
    }

    public String getGreetingById(Long id) {
        return greetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Greeting not found with id: " + id));
    }
}
