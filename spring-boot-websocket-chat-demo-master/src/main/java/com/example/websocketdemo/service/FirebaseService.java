package com.example.websocketdemo.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
public class FirebaseService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public FirebaseUserToken verifyToken(String idToken) throws Exception {
        if (!FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                return new FirebaseUserToken(decodedToken.getEmail(), (String) decodedToken.getClaims().get("name"), true);
            } catch (Exception e) {
                System.err.println("Firebase token verification failed via Admin SDK: " + e.getMessage());
                return decodeTokenFallback(idToken, false);
            }
        } else {
            return decodeTokenFallback(idToken, false);
        }
    }

    private FirebaseUserToken decodeTokenFallback(String idToken, boolean verified) throws Exception {
        if (idToken == null || idToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Token is empty");
        }
        String cleanToken = idToken.trim();
        String[] parts = cleanToken.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid token format");
        }
        
        String payloadPart = parts[1];
        int rem = payloadPart.length() % 4;
        if (rem > 0) {
            payloadPart += "=".repeat(4 - rem);
        }
        
        byte[] decodedBytes;
        try {
            decodedBytes = Base64.getUrlDecoder().decode(payloadPart);
        } catch (Exception e1) {
            try {
                decodedBytes = Base64.getDecoder().decode(payloadPart);
            } catch (Exception e2) {
                decodedBytes = Base64.getMimeDecoder().decode(payloadPart);
            }
        }
        
        String payloadJson = new String(decodedBytes, StandardCharsets.UTF_8);
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);
        
        String email = (String) payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            String sub = (String) payload.get("sub");
            String userId = (String) payload.get("user_id");
            String identifier = sub != null ? sub : (userId != null ? userId : "user_" + System.currentTimeMillis());
            email = identifier + "@google.com";
        }
        
        String name = (String) payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            name = email.contains("@") ? email.substring(0, email.indexOf("@")) : "googleuser";
        }
        
        return new FirebaseUserToken(email, name, verified);
    }

    public static class FirebaseUserToken {
        private final String email;
        private final String name;
        private final boolean verified;

        public FirebaseUserToken(String email, String name, boolean verified) {
            this.email = email;
            this.name = name;
            this.verified = verified;
        }

        public String getEmail() {
            return email;
        }

        public String getName() {
            return name;
        }

        public boolean isVerified() {
            return verified;
        }
    }
}
