package com.example.websocketdemo.controller;

import com.example.websocketdemo.model.ChatMessage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class ChatHistoryRegistry {
    private static final String FILE_PATH = "chat_history.json";
    private static final List<ChatMessage> history = new CopyOnWriteArrayList<>();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    static {
        loadHistory();
    }

    public static List<ChatMessage> getHistory() {
        return new ArrayList<>(history);
    }

    public static void addMessage(ChatMessage message) {
        if (message.getType() == ChatMessage.MessageType.CHAT) {
            history.add(message);
            saveHistory();
        }
    }

    private static synchronized void loadHistory() {
        File file = new File(FILE_PATH);
        if (file.exists()) {
            try {
                List<ChatMessage> loaded = objectMapper.readValue(file, new TypeReference<List<ChatMessage>>() {});
                history.addAll(loaded);
            } catch (IOException e) {
                System.err.println("Could not load chat history: " + e.getMessage());
            }
        }
    }

    private static synchronized void saveHistory() {
        try {
            objectMapper.writeValue(new File(FILE_PATH), history);
        } catch (IOException e) {
            System.err.println("Could not save chat history: " + e.getMessage());
        }
    }
}
