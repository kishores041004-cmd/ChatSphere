package com.example.websocketdemo.controller;

import com.example.websocketdemo.model.ChatMessage;
import com.example.websocketdemo.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage,
                                   SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username == null) {
            throw new IllegalStateException("Not authenticated");
        }
        chatMessage.setSender(username);
        chatMessageRepository.save(chatMessage);
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username == null) {
            throw new IllegalStateException("Not authenticated");
        }
        chatMessage.setSender(username);
        return chatMessage;
    }

    @MessageMapping("/chat.typing")
    @SendTo("/topic/public")
    public ChatMessage typing(@Payload ChatMessage chatMessage,
                              SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username == null) {
            throw new IllegalStateException("Not authenticated");
        }
        chatMessage.setSender(username);
        return chatMessage;
    }

    @MessageMapping("/chat.editMessage")
    @SendTo("/topic/public")
    public ChatMessage editMessage(@Payload ChatMessage chatMessage,
                                   SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username == null) {
            throw new IllegalStateException("Not authenticated");
        }
        
        if (chatMessage.getId() == null) {
            throw new IllegalArgumentException("Message ID is required for editing");
        }
        
        ChatMessage existing = chatMessageRepository.findById(chatMessage.getId())
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
                
        if (!existing.getSender().equalsIgnoreCase(username)) {
            throw new IllegalStateException("You are not authorized to edit this message");
        }
        
        long elapsed = System.currentTimeMillis() - existing.getCreatedAt();
        if (elapsed > 5 * 60 * 1000) {
            throw new IllegalStateException("Messages can only be edited within 5 minutes of sending");
        }
        
        existing.setContent(chatMessage.getContent());
        existing.setType(ChatMessage.MessageType.EDIT);
        chatMessageRepository.save(existing);
        return existing;
    }

    @MessageMapping("/chat.deleteMessage")
    @SendTo("/topic/public")
    public ChatMessage deleteMessage(@Payload ChatMessage chatMessage,
                                     SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username == null) {
            throw new IllegalStateException("Not authenticated");
        }
        
        if (chatMessage.getId() == null) {
            throw new IllegalArgumentException("Message ID is required for deletion");
        }
        
        ChatMessage existing = chatMessageRepository.findById(chatMessage.getId())
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
                
        if (!existing.getSender().equalsIgnoreCase(username)) {
            throw new IllegalStateException("You are not authorized to delete this message");
        }
        
        long elapsed = System.currentTimeMillis() - existing.getCreatedAt();
        if (elapsed > 5 * 60 * 1000) {
            throw new IllegalStateException("Messages can only be deleted within 5 minutes of sending");
        }
        
        chatMessageRepository.delete(existing);
        
        ChatMessage response = new ChatMessage();
        response.setId(chatMessage.getId());
        response.setRoomId(existing.getRoomId());
        response.setType(ChatMessage.MessageType.DELETE);
        return response;
    }
}
