package com.example.websocketdemo.model;

import javax.persistence.*;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "chat_rooms")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "created_by")
    private String createdBy;

    private String description;

    @Column(name = "pinned_message_id")
    private Long pinnedMessageId;

    @Column(name = "pinned_message_content")
    private String pinnedMessageContent;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "room_members", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "username")
    private Set<String> members = new HashSet<>();

    public ChatRoom() {
    }

    public ChatRoom(String name, String createdBy) {
        this.name = name;
        this.createdBy = createdBy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getPinnedMessageId() {
        return pinnedMessageId;
    }

    public void setPinnedMessageId(Long pinnedMessageId) {
        this.pinnedMessageId = pinnedMessageId;
    }

    public String getPinnedMessageContent() {
        return pinnedMessageContent;
    }

    public void setPinnedMessageContent(String pinnedMessageContent) {
        this.pinnedMessageContent = pinnedMessageContent;
    }

    public Set<String> getMembers() {
        return members;
    }

    public void setMembers(Set<String> members) {
        this.members = members;
    }
}
