package com.example.websocketdemo.repository;

import com.example.websocketdemo.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomId(Long roomId);
    List<ChatMessage> findByRoomIdIsNull();
}
