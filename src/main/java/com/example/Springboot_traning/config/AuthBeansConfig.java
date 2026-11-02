package com.example.Springboot_traning.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AuthBeansConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
