package com.example.websocketdemo.controller;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class ActiveUserRegistry {
    public static final Set<String> activeUsers = ConcurrentHashMap.newKeySet();

    public static String makeUnique(String baseUsername) {
        return baseUsername;
    }
}
