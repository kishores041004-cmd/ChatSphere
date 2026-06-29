package com.example.websocketdemo.repository;

import com.example.websocketdemo.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomId(Long roomId);
    List<ChatMessage> findByRoomIdIsNull();
    List<ChatMessage> findByRoomIdAndCreatedAtGreaterThanEqual(Long roomId, Long createdAt);
    List<ChatMessage> findByRoomIdIsNullAndCreatedAtGreaterThanEqual(Long createdAt);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteByRoomId(Long roomId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteByRoomIdIsNull();

    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m WHERE " +
            "((lower(m.sender) = lower(:user1) AND lower(m.recipient) = lower(:user2)) OR " +
            " (lower(m.sender) = lower(:user2) AND lower(m.recipient) = lower(:user1))) AND " +
            "m.createdAt >= :createdAt ORDER BY m.createdAt ASC")
    List<ChatMessage> findPrivateHistory(String user1, String user2, Long createdAt);
}
