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
        String[] parts = idToken.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid token format");
        }
        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);
        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
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
