package com.example.Springboot_traning.repository;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class GreetingRepository {

    private final Map<Long, String> greetingStore = new HashMap<>();
    private Long idCounter = 1L;

    public String save(String message) {
        greetingStore.put(idCounter++, message);
        return message;
    }

    public Optional<String> findById(Long id) {
        return Optional.ofNullable(greetingStore.get(id));
    }

    public List<String> findAll() {
        return new ArrayList<>(greetingStore.values());
    }

    public void deleteById(Long id) {
        greetingStore.remove(id);
    }
}
