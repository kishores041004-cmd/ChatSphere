package com.example.websocketdemo.controller;

import com.example.websocketdemo.model.User;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDto userDto) {
        String username = userDto.getUsername();
        String password = userDto.getPassword();

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password cannot be empty"));
        }

        username = username.trim();
        if (userRepository.findByUsername(username.toLowerCase()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Username already exists"));
        }

        // Hash and store the password
        String hashedPassword = hashPassword(password);
        userRepository.save(new User(username.toLowerCase(), hashedPassword));

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

        Optional<User> userOpt = userRepository.findByUsername(username.toLowerCase());
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
    public ResponseEntity<?> getHistory() {
        return ResponseEntity.ok(chatMessageRepository.findByRoomIdIsNull());
    }

    @GetMapping("/history/{roomId}")
    public ResponseEntity<?> getRoomHistory(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatMessageRepository.findByRoomId(roomId));
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
        return ResponseEntity.ok(room);
    }

    @GetMapping("/active-users")
    public ResponseEntity<?> getActiveUsers() {
        return ResponseEntity.ok(ActiveUserRegistry.activeUsers);
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
}
