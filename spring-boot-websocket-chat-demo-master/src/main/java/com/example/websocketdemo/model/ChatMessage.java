package com.example.websocketdemo.model;

import javax.persistence.*;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private String sender;

    @Column(name = "created_at")
    private Long createdAt = System.currentTimeMillis();

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "deleted_for", length = 2000)
    private String deletedFor = "";

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "reply_to_id")
    private Long replyToId;

    @Column(name = "reply_to_sender")
    private String replyToSender;

    @Column(name = "reply_to_content", length = 1000)
    private String replyToContent;

    @Column(name = "recipient")
    private String recipient;

    @Column(name = "destruct_duration")
    private Integer destructDuration;

    @Column(name = "transcription", length = 2000)
    private String transcription;

    @Column(name = "reactions", length = 2000)
    private String reactions;

    @Column(name = "caption", length = 1000)
    private String caption;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        TYPING,
        EDIT,
        DELETE,
        CLEAR,
        BULK_DELETE,
        VOICE,
        FILE,
        REACTION_UPDATE
    }

    public ChatMessage() {
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getDeletedFor() {
        return deletedFor;
    }

    public void setDeletedFor(String deletedFor) {
        this.deletedFor = deletedFor;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getReplyToId() {
        return replyToId;
    }

    public void setReplyToId(Long replyToId) {
        this.replyToId = replyToId;
    }

    public String getReplyToSender() {
        return replyToSender;
    }

    public void setReplyToSender(String replyToSender) {
        this.replyToSender = replyToSender;
    }

    public String getReplyToContent() {
        return replyToContent;
    }

    public void setReplyToContent(String replyToContent) {
        this.replyToContent = replyToContent;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public Integer getDestructDuration() {
        return destructDuration;
    }

    public void setDestructDuration(Integer destructDuration) {
        this.destructDuration = destructDuration;
    }

    public String getTranscription() {
        return transcription;
    }

    public void setTranscription(String transcription) {
        this.transcription = transcription;
    }

    public String getReactions() {
        return reactions;
    }

    public void setReactions(String reactions) {
        this.reactions = reactions;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }
}

