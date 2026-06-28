package com.example.websocketdemo.controller;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class ActiveUserRegistry {
    public static final Set<String> activeUsers = ConcurrentHashMap.newKeySet();

    public static String makeUnique(String baseUsername) {
        String username = baseUsername;
        int suffix = 1;
        while (activeUsers.contains(username)) {
            username = baseUsername + "_" + suffix;
            suffix++;
        }
        return username;
    }
}
