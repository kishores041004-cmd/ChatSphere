package com.example.websocketdemo.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .build();
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Admin SDK initialized successfully with Application Default Credentials.");
            }
        } catch (Exception e) {
            System.err.println("Firebase Admin SDK failed to initialize: " + e.getMessage());
            System.err.println("Firebase Auth will run in local verification / fallback mode for development.");
        }
    }
}
