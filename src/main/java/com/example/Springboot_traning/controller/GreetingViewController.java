package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.service.GreetingService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class GreetingViewController {

    private final GreetingService greetingService;

    public GreetingViewController(GreetingService greetingService) {
        this.greetingService = greetingService;
    }

    @GetMapping("/welcome")
    @ResponseBody
    public String welcome() {
        return greetingService.getPersonalizedGreeting("Omkar");
    }
}
