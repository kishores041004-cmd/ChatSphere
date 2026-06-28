package com.example.websocketdemo.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class UserController {

    // Simple thread-safe registry of username -> hashed password
    private static final Map<String, String> userRegistry = new ConcurrentHashMap<>();
    private static final String DATA_DIR = System.getenv("DATA_DIR") != null ? System.getenv("DATA_DIR") : "";
    private static final String USERS_FILE_PATH = DATA_DIR.isEmpty() ? "users.json" : (DATA_DIR + "/users.json");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    static {
        loadUsers();
    }

    private static synchronized void loadUsers() {
        File file = new File(USERS_FILE_PATH);
        if (file.exists()) {
            try {
                Map<String, String> loaded = objectMapper.readValue(file, new TypeReference<Map<String, String>>() {});
                userRegistry.putAll(loaded);
            } catch (IOException e) {
                System.err.println("Could not load users: " + e.getMessage());
            }
        }
    }

    private static synchronized void saveUsers() {
        try {
            objectMapper.writeValue(new File(USERS_FILE_PATH), userRegistry);
        } catch (IOException e) {
            System.err.println("Could not save users: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDto userDto) {
        String username = userDto.getUsername();
        String password = userDto.getPassword();

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password cannot be empty"));
        }

        username = username.trim();
        if (userRegistry.containsKey(username.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Username already exists"));
        }

        // Hash and store the password
        String hashedPassword = hashPassword(password);
        userRegistry.put(username.toLowerCase(), hashedPassword);
        saveUsers();

        return ResponseEntity.ok(Map.of("message", "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDto userDto, HttpSession session) {
        String username = userDto.getUsername();
        String password = userDto.getPassword();

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password cannot be empty"));
        }

        username = username.trim();
        String hashedPassword = hashPassword(password);

        String storedPassword = userRegistry.get(username.toLowerCase());
        if (storedPassword == null || !storedPassword.equals(hashedPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid username or password"));
        }

        // Save username in HTTP session
        session.setAttribute("username", username);

        return ResponseEntity.ok(Map.of("username", username));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username != null) {
            return ResponseEntity.ok(Map.of("username", username, "authenticated", true, "authMethod", "form"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        return ResponseEntity.ok(ChatHistoryRegistry.getHistory());
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    public static class UserDto {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
