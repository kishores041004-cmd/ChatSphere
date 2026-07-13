package com.example.websocketdemo.controller;

import com.example.websocketdemo.model.User;
import com.example.websocketdemo.model.ChatMessage;
import com.example.websocketdemo.model.ChatRoom;
import com.example.websocketdemo.repository.UserRepository;
import com.example.websocketdemo.repository.ChatMessageRepository;
import com.example.websocketdemo.repository.ChatRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import com.example.websocketdemo.service.FirebaseService;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private org.springframework.messaging.simp.SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private com.example.websocketdemo.service.EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDto userDto) {
        String username = userDto.getUsername();
        String password = userDto.getPassword();

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password cannot be empty"));
        }

        username = username.trim();
        if (userRepository.findByUsernameIgnoreCase(username).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Username already exists"));
        }

        // Hash and store the password
        String hashedPassword = hashPassword(password);
        userRepository.save(new User(username, hashedPassword));

        return ResponseEntity.ok(Map.of("message", "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDto userDto, HttpSession session) {
        String username = userDto.getUsername();
        String password = userDto.getPassword();

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password cannot be empty"));
        }

        username = username.trim();
        String hashedPassword = hashPassword(password);

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(hashedPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid username or password"));
        }

        // Block duplicate logins from other devices/tabs
        final String finalUsername = username.toLowerCase();
        boolean alreadyLoggedIn = ActiveUserRegistry.activeUsers.stream()
                .anyMatch(u -> u.toLowerCase().equals(finalUsername));
        if (alreadyLoggedIn) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "User is already logged in on another device or tab"));
        }

        // Save username in HTTP session
        session.setAttribute("username", username);

        return ResponseEntity.ok(Map.of("username", username));
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> body, HttpSession session) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "ID token is required"));
        }

        try {
            FirebaseService.FirebaseUserToken token = firebaseService.verifyToken(idToken);
            String email = token.getEmail();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid token: email not found"));
            }

            Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String username = user.getUsername();

                // Block duplicate logins from other devices/tabs
                final String finalUsername = username.toLowerCase();
                boolean alreadyLoggedIn = ActiveUserRegistry.activeUsers.stream()
                        .anyMatch(u -> u.toLowerCase().equals(finalUsername));
                if (alreadyLoggedIn) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "User is already logged in on another device or tab"));
                }

                // Save username in HTTP session
                session.setAttribute("username", username);
                return ResponseEntity.ok(Map.of("status", "success", "username", username));
            } else {
                // Register new Google user automatically using Google Account Name
                String baseUsername = token.getName();
                if (baseUsername == null || baseUsername.trim().isEmpty()) {
                    baseUsername = email.substring(0, email.indexOf("@"));
                }
                baseUsername = baseUsername.replaceAll("\\s+", ".").replaceAll("[^a-zA-Z0-9._-]", "");
                if (baseUsername.trim().isEmpty()) {
                    baseUsername = "googleuser";
                }

                String finalUsername = baseUsername;
                int suffix = 1;
                while (userRepository.findByUsernameIgnoreCase(finalUsername).isPresent()) {
                    finalUsername = baseUsername + suffix;
                    suffix++;
                }

                String randomPassword = hashPassword(UUID.randomUUID().toString());
                User newUser = new User(finalUsername, randomPassword, email.toLowerCase());
                userRepository.save(newUser);

                // Save username in HTTP session
                session.setAttribute("username", finalUsername);
                return ResponseEntity.ok(Map.of("status", "success", "username", finalUsername));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication failed: " + e.getMessage()));
        }
    }

    @PostMapping("/firebase-register")
    public ResponseEntity<?> firebaseRegister(@RequestBody Map<String, String> body, HttpSession session) {
        String idToken = body.get("idToken");
        String username = body.get("username");

        if (idToken == null || idToken.trim().isEmpty() || username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "ID token and username are required"));
        }

        username = username.trim();
        try {
            FirebaseService.FirebaseUserToken token = firebaseService.verifyToken(idToken);
            String email = token.getEmail();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid token: email not found"));
            }

            // Check if username is already taken
            if (userRepository.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Username already exists"));
            }

            // Check if user with this email is already registered
            if (userRepository.findByEmail(email.toLowerCase()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email is already registered"));
            }

            // Register new Google user (generate random secure password)
            String randomPassword = UUID.randomUUID().toString();
            String hashedPassword = hashPassword(randomPassword);
            User newUser = new User(username, hashedPassword, email.toLowerCase());
            userRepository.save(newUser);

            // Block duplicate logins from other devices/tabs
            final String finalUsername = username.toLowerCase();
            boolean alreadyLoggedIn = ActiveUserRegistry.activeUsers.stream()
                    .anyMatch(u -> u.toLowerCase().equals(finalUsername));
            if (alreadyLoggedIn) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "User is already logged in on another device or tab"));
            }

            // Save username in HTTP session
            session.setAttribute("username", username);
            return ResponseEntity.ok(Map.of("status", "success", "username", username));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication failed: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username != null) {
            return ResponseEntity.ok(Map.of("username", username, "authenticated", true, "authMethod", "form"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        long registrationTime = 0L;
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCreatedAt() != null) {
                registrationTime = user.getCreatedAt();
            }
        }

        List<ChatMessage> messages = chatMessageRepository.findByRoomIdIsNullAndCreatedAtGreaterThanEqual(registrationTime);
        final String searchString = username.toLowerCase() + ",";
        List<ChatMessage> filtered = messages.stream()
                .filter(msg -> msg.getDeletedFor() == null || !msg.getDeletedFor().contains(searchString))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/history/{roomId}")
    public ResponseEntity<?> getRoomHistory(@PathVariable Long roomId, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        long registrationTime = 0L;
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCreatedAt() != null) {
                registrationTime = user.getCreatedAt();
            }
        }

        List<ChatMessage> messages = chatMessageRepository.findByRoomIdAndCreatedAtGreaterThanEqual(roomId, registrationTime);
        final String searchString = username.toLowerCase() + ",";
        List<ChatMessage> filtered = messages.stream()
                .filter(msg -> msg.getDeletedFor() == null || !msg.getDeletedFor().contains(searchString))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .map(User::getUsername)
                .collect(Collectors.toList()));
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> getMyRooms(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        return ResponseEntity.ok(chatRoomRepository.findRoomsForUser(username.toLowerCase()));
    }

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody RoomDto roomDto, HttpSession session) {
        String creator = (String) session.getAttribute("username");
        if (creator == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        if (roomDto.getName() == null || roomDto.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Room name cannot be empty"));
        }
        
        ChatRoom room = new ChatRoom(roomDto.getName().trim(), creator);
        room.getMembers().add(creator.toLowerCase());
        if (roomDto.getMembers() != null) {
            for (String member : roomDto.getMembers()) {
                room.getMembers().add(member.trim().toLowerCase());
            }
        }
        chatRoomRepository.save(room);

        try {
            String membersStr = String.join(",", room.getMembers());
            com.example.websocketdemo.model.ChatMessage broadcast = new com.example.websocketdemo.model.ChatMessage();
            broadcast.setType(com.example.websocketdemo.model.ChatMessage.MessageType.JOIN);
            broadcast.setContent("ROOM_CREATED:" + room.getId() + ":" + room.getName() + ":" + membersStr);
            broadcast.setSender(creator);
            messagingTemplate.convertAndSend("/topic/public", broadcast);
        } catch (Exception e) {
            // Ignore messaging exception if any
        }

        return ResponseEntity.ok(room);
    }

    @PostMapping("/rooms/{roomId}/description")
    public ResponseEntity<?> updateDescription(@PathVariable Long roomId, @RequestBody Map<String, String> body, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found"));
        }
        if (!room.getMembers().contains(username.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not a member of this group"));
        }
        room.setDescription(body.get("description"));
        chatRoomRepository.save(room);

        // Broadcast updated room creation state so all members reload their view in real-time
        try {
            String membersStr = String.join(",", room.getMembers());
            com.example.websocketdemo.model.ChatMessage broadcast = new com.example.websocketdemo.model.ChatMessage();
            broadcast.setType(com.example.websocketdemo.model.ChatMessage.MessageType.JOIN);
            broadcast.setContent("ROOM_CREATED:" + room.getId() + ":" + room.getName() + ":" + membersStr);
            broadcast.setSender(username);
            messagingTemplate.convertAndSend("/topic/public", broadcast);
        } catch (Exception e) {}

        return ResponseEntity.ok(room);
    }

    @PostMapping("/rooms/{roomId}/members")
    public ResponseEntity<?> addMembers(@PathVariable Long roomId, @RequestBody Map<String, List<String>> body, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found"));
        }
        if (!room.getMembers().contains(username.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not a member of this group"));
        }
        List<String> newMembers = body.get("members");
        if (newMembers != null) {
            for (String member : newMembers) {
                room.getMembers().add(member.trim().toLowerCase());
            }
        }
        chatRoomRepository.save(room);

        // Broadcast room creation/update state so new members reload their sidebar in real-time
        try {
            String membersStr = String.join(",", room.getMembers());
            com.example.websocketdemo.model.ChatMessage broadcast = new com.example.websocketdemo.model.ChatMessage();
            broadcast.setType(com.example.websocketdemo.model.ChatMessage.MessageType.JOIN);
            broadcast.setContent("ROOM_CREATED:" + room.getId() + ":" + room.getName() + ":" + membersStr);
            broadcast.setSender(username);
            messagingTemplate.convertAndSend("/topic/public", broadcast);
        } catch (Exception e) {}

        return ResponseEntity.ok(room);
    }

    @PostMapping("/rooms/{roomId}/exit")
    public ResponseEntity<?> exitRoom(@PathVariable Long roomId, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found"));
        }
        if (!room.getMembers().contains(username.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not a member of this group"));
        }
        room.getMembers().remove(username.toLowerCase());
        if (room.getMembers().isEmpty()) {
            chatRoomRepository.delete(room);
        } else {
            chatRoomRepository.save(room);
            
            // Broadcast room update state so remaining members update in real-time
            try {
                String membersStr = String.join(",", room.getMembers());
                com.example.websocketdemo.model.ChatMessage broadcast = new com.example.websocketdemo.model.ChatMessage();
                broadcast.setType(com.example.websocketdemo.model.ChatMessage.MessageType.JOIN);
                broadcast.setContent("ROOM_CREATED:" + room.getId() + ":" + room.getName() + ":" + membersStr);
                broadcast.setSender(username);
                messagingTemplate.convertAndSend("/topic/public", broadcast);
            } catch (Exception e) {}
        }
        return ResponseEntity.ok(Map.of("message", "Exited successfully"));
    }

    @PostMapping("/rooms/{roomId}/pin/{messageId}")
    public ResponseEntity<?> pinMessage(@PathVariable Long roomId, @PathVariable Long messageId, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found"));
        }
        if (!room.getMembers().contains(username.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not a member of this group"));
        }
        com.example.websocketdemo.model.ChatMessage msg = chatMessageRepository.findById(messageId).orElse(null);
        if (msg == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Message not found"));
        }
        
        room.setPinnedMessageId(messageId);
        room.setPinnedMessageContent(msg.getContent());
        chatRoomRepository.save(room);

        // Broadcast updated room state so all members reload their view in real-time
        try {
            String membersStr = String.join(",", room.getMembers());
            com.example.websocketdemo.model.ChatMessage broadcast = new com.example.websocketdemo.model.ChatMessage();
            broadcast.setType(com.example.websocketdemo.model.ChatMessage.MessageType.JOIN);
            broadcast.setContent("ROOM_CREATED:" + room.getId() + ":" + room.getName() + ":" + membersStr);
            broadcast.setSender(username);
            messagingTemplate.convertAndSend("/topic/public", broadcast);
        } catch (Exception e) {}

        return ResponseEntity.ok(room);
    }

    @PostMapping("/rooms/{roomId}/unpin")
    public ResponseEntity<?> unpinMessage(@PathVariable Long roomId, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found"));
        }
        if (!room.getMembers().contains(username.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not a member of this group"));
        }
        room.setPinnedMessageId(null);
        room.setPinnedMessageContent(null);
        chatRoomRepository.save(room);

        // Broadcast updated room state so all members reload their view in real-time
        try {
            String membersStr = String.join(",", room.getMembers());
            com.example.websocketdemo.model.ChatMessage broadcast = new com.example.websocketdemo.model.ChatMessage();
            broadcast.setType(com.example.websocketdemo.model.ChatMessage.MessageType.JOIN);
            broadcast.setContent("ROOM_CREATED:" + room.getId() + ":" + room.getName() + ":" + membersStr);
            broadcast.setSender(username);
            messagingTemplate.convertAndSend("/topic/public", broadcast);
        } catch (Exception e) {}

        return ResponseEntity.ok(room);
    }

    @GetMapping("/active-users")
    public ResponseEntity<?> getActiveUsers() {
        return ResponseEntity.ok(ActiveUserRegistry.activeUsers);
    }

    @PostMapping("/history/clear")
    public ResponseEntity<?> clearPublicHistory(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        chatMessageRepository.deleteByRoomIdIsNull();

        // Broadcast the CLEAR message to all clients so they clear their screen in real-time
        try {
            com.example.websocketdemo.model.ChatMessage clearMsg = new com.example.websocketdemo.model.ChatMessage();
            clearMsg.setType(com.example.websocketdemo.model.ChatMessage.MessageType.CLEAR);
            clearMsg.setRoomId(null);
            clearMsg.setSender(username);
            messagingTemplate.convertAndSend("/topic/public", clearMsg);
        } catch (Exception e) {}

        return ResponseEntity.ok(Map.of("message", "Public chat history cleared successfully"));
    }

    @PostMapping("/rooms/{roomId}/clear")
    public ResponseEntity<?> clearRoomHistory(@PathVariable Long roomId, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found"));
        }
        if (!room.getMembers().contains(username.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not a member of this room"));
        }

        chatMessageRepository.deleteByRoomId(roomId);

        // Broadcast the CLEAR message to all clients so they clear their screen in real-time
        try {
            com.example.websocketdemo.model.ChatMessage clearMsg = new com.example.websocketdemo.model.ChatMessage();
            clearMsg.setType(com.example.websocketdemo.model.ChatMessage.MessageType.CLEAR);
            clearMsg.setRoomId(roomId);
            clearMsg.setSender(username);
            messagingTemplate.convertAndSend("/topic/public", clearMsg);
        } catch (Exception e) {}

        return ResponseEntity.ok(Map.of("message", "Room chat history cleared successfully"));
    }

    @PostMapping("/users/delete-me")
    public ResponseEntity<?> deleteMe(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isPresent()) {
            userRepository.delete(userOpt.get());
        }

        // Log out the user and clear context
        session.invalidate();
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }

    @PostMapping("/messages/bulk-delete")
    public ResponseEntity<?> bulkDeleteMessages(@RequestBody Map<String, Object> payload, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        List<Object> rawIds = (List<Object>) payload.get("messageIds");
        String deleteType = (String) payload.get("deleteType"); // "FOR_ME" or "FOR_EVERYONE"

        if (rawIds == null || rawIds.isEmpty() || deleteType == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid payload"));
        }

        List<Long> messageIds = rawIds.stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());

        List<ChatMessage> messages = chatMessageRepository.findAllById(messageIds);

        if ("FOR_EVERYONE".equalsIgnoreCase(deleteType)) {
            // Verify that all messages were sent by the logged-in user
            for (ChatMessage msg : messages) {
                if (!msg.getSender().equalsIgnoreCase(username)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "You can only delete your own messages for everyone"));
                }
            }

            chatMessageRepository.deleteAll(messages);

            // Broadcast bulk delete via WebSocket
            try {
                ChatMessage broadcast = new ChatMessage();
                broadcast.setType(ChatMessage.MessageType.BULK_DELETE);
                String idsStr = messageIds.stream().map(Object::toString).collect(Collectors.joining(","));
                broadcast.setContent(idsStr);
                broadcast.setSender(username);
                messagingTemplate.convertAndSend("/topic/public", broadcast);
            } catch (Exception e) {}
        } else {
            // FOR_ME: append username to deletedFor
            final String appendStr = username.toLowerCase() + ",";
            for (ChatMessage msg : messages) {
                String existing = msg.getDeletedFor() != null ? msg.getDeletedFor() : "";
                if (!existing.contains(appendStr)) {
                    msg.setDeletedFor(existing + appendStr);
                }
            }
            chatMessageRepository.saveAll(messages);
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Messages deleted successfully"));
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    public static class UserDto {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class RoomDto {
        private String name;
        private List<String> members;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<String> getMembers() {
            return members;
        }

        public void setMembers(List<String> members) {
            this.members = members;
        }
    }

    @GetMapping("/history/private/{otherUser}")
    public ResponseEntity<?> getPrivateHistory(@PathVariable String otherUser, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        long registrationTime = 0L;
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCreatedAt() != null) {
                registrationTime = user.getCreatedAt();
            }
        }

        List<ChatMessage> messages = chatMessageRepository.findPrivateHistory(username, otherUser, registrationTime);
        final String searchString = username.toLowerCase() + ",";
        List<ChatMessage> filtered = messages.stream()
                .filter(msg -> msg.getDeletedFor() == null || !msg.getDeletedFor().contains(searchString))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/link-preview")
    public ResponseEntity<?> getLinkPreview(@RequestParam String url) {
        if (url == null || url.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "URL is required"));
        }

        try {
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }

            java.net.URL urlObj = new java.net.URL(url);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) urlObj.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

            int status = conn.getResponseCode();
            if (status != 200) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "Failed to load page"));
            }

            java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            String inputLine;
            StringBuilder content = new StringBuilder();
            int charsRead = 0;
            while ((inputLine = in.readLine()) != null && charsRead < 100000) {
                content.append(inputLine).append("\n");
                charsRead += inputLine.length();
            }
            in.close();
            conn.disconnect();

            String html = content.toString();

            String title = extractMetaContent(html, "og:title");
            if (title == null) {
                java.util.regex.Pattern p = java.util.regex.Pattern.compile("<title>(.*?)</title>", java.util.regex.Pattern.CASE_INSENSITIVE);
                java.util.regex.Matcher m = p.matcher(html);
                if (m.find()) {
                    title = m.group(1);
                }
            }

            String description = extractMetaContent(html, "og:description");
            if (description == null) {
                description = extractMetaContent(html, "description");
            }

            String image = extractMetaContent(html, "og:image");

            Map<String, String> response = new java.util.HashMap<>();
            response.put("title", title != null ? title.trim() : "");
            response.put("description", description != null ? description.trim() : "");
            response.put("image", image != null ? image.trim() : "");
            response.put("url", url);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Error parsing metadata: " + e.getMessage()));
        }
    }

    private String extractMetaContent(String html, String propertyName) {
        String regex = "<meta[^>]+(?:property|name)\\s*=\\s*['\"]" + java.util.regex.Pattern.quote(propertyName) + "['\"][^>]+content\\s*=\\s*['\"]([^'\"]+)['\"]";
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(regex, java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher m = p.matcher(html);
        if (m.find()) {
            return m.group(1);
        }
        String regexAlt = "<meta[^>]+content\\s*=\\s*['\"]([^'\"]+)['\"][^>]+(?:property|name)\\s*=\\s*['\"]" + java.util.regex.Pattern.quote(propertyName) + "['\"]";
        java.util.regex.Pattern pAlt = java.util.regex.Pattern.compile(regexAlt, java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher mAlt = pAlt.matcher(html);
        if (mAlt.find()) {
            return mAlt.group(1);
        }
        return null;
    }

    @PostMapping("/messages/{messageId}/react")
    public ResponseEntity<?> reactToMessage(@PathVariable Long messageId, @RequestParam String emoji, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        Optional<ChatMessage> msgOpt = chatMessageRepository.findById(messageId);
        if (!msgOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        ChatMessage message = msgOpt.get();
        String reactionsJson = message.getReactions();
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        Map<String, List<String>> reactionsMap;

        try {
            if (reactionsJson == null || reactionsJson.trim().isEmpty()) {
                reactionsMap = new java.util.HashMap<>();
            } else {
                reactionsMap = mapper.readValue(reactionsJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, List<String>>>() {});
            }

            List<String> users = reactionsMap.computeIfAbsent(emoji, k -> new java.util.ArrayList<>());
            if (users.contains(username)) {
                users.remove(username);
            } else {
                users.add(username);
            }

            if (users.isEmpty()) {
                reactionsMap.remove(emoji);
            }

            String updatedJson = mapper.writeValueAsString(reactionsMap);
            message.setReactions(updatedJson);
            chatMessageRepository.save(message);

            ChatMessage broadcastMsg = new ChatMessage();
            broadcastMsg.setId(message.getId());
            broadcastMsg.setType(ChatMessage.MessageType.REACTION_UPDATE);
            broadcastMsg.setContent(updatedJson);
            broadcastMsg.setRoomId(message.getRoomId());
            broadcastMsg.setRecipient(message.getRecipient());

            messagingTemplate.convertAndSend("/topic/public", broadcastMsg);

            return ResponseEntity.ok(reactionsMap);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Reaction error: " + e.getMessage()));
        }
    }

    @GetMapping("/translate")
    public ResponseEntity<?> translate(@RequestParam String text, @RequestParam String to) {
        try {
            String url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + to + "&dt=t&q=" + java.net.URLEncoder.encode(text, "UTF-8");
            java.net.URL urlObj = new java.net.URL(url);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) urlObj.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");

            java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            String inputLine;
            StringBuilder response = new StringBuilder();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            conn.disconnect();

            String json = response.toString();
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("^\\s*\\[\\s*\\[\\s*\\[\\s*\"([^\"]+)\"");
            java.util.regex.Matcher m = p.matcher(json);
            String translated = "";
            if (m.find()) {
                translated = m.group(1);
                translated = translated.replace("\\n", "\n");
            } else {
                translated = "Translation failed";
            }

            return ResponseEntity.ok(Map.of("translatedText", translated));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Translation error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/messages/self-destruct/{messageId}")
    public ResponseEntity<?> selfDestructMessage(@PathVariable Long messageId, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        Optional<ChatMessage> msgOpt = chatMessageRepository.findById(messageId);
        if (!msgOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        ChatMessage message = msgOpt.get();
        if (message.getDestructDuration() != null && message.getDestructDuration() > 0) {
            chatMessageRepository.delete(message);

            ChatMessage response = new ChatMessage();
            response.setId(message.getId());
            response.setRoomId(message.getRoomId());
            response.setRecipient(message.getRecipient());
            response.setType(ChatMessage.MessageType.DELETE);
            messagingTemplate.convertAndSend("/topic/public", response);

            return ResponseEntity.ok(Map.of("message", "Self-destruct completed"));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not a disappearing message"));
    }

    @PostMapping("/messages/support/notify")
    public ResponseEntity<?> notifySupport(@RequestBody Map<String, String> payload, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }

        String phone = payload.get("phone");
        String message = payload.get("message");

        if (phone == null || phone.trim().isEmpty() || message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number and message content are required"));
        }

        // Send email notification to kishore.s041004@gmail.com
        emailService.sendSupportNotification(username, phone, message);

        // Find the admin user with email kishore.s041004@gmail.com
        String adminUsername = "kishores041004"; // default fallback
        java.util.List<User> admins = userRepository.findAll();
        for (User u : admins) {
            if ("kishore.s041004@gmail.com".equalsIgnoreCase(u.getEmail())) {
                adminUsername = u.getUsername();
                break;
            }
        }

        // Save a private support message in the database so the admin receives it in the chat app!
        ChatMessage chatMsg = new ChatMessage();
        chatMsg.setSender(username);
        chatMsg.setRecipient(adminUsername);
        chatMsg.setContent("[Support Request] Phone: " + phone + "\nMessage: " + message);
        chatMsg.setType(ChatMessage.MessageType.CHAT);
        chatMsg.setCreatedAt(System.currentTimeMillis());
        chatMessageRepository.save(chatMsg);

        // Broadcast to WebSocket to notify the admin live if online
        messagingTemplate.convertAndSend("/topic/public", chatMsg);

        return ResponseEntity.ok(Map.of("message", "Support request submitted successfully"));
    }
}
