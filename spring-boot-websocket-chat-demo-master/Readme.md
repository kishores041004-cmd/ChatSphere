# ChatSphere Backend 💬

ChatSphere is a real-time web chat service backend built using **Spring Boot**, **Spring WebSocket (STOMP)**, **Spring Security**, and an **H2 In-Memory Database** (supporting optional Firebase auth sync).

It serves as the backend engine for managing users, messaging rooms, private direct messages, and handling real-time WebSockets connections.

---

## 🌟 Key Features

* **Real-Time Messaging:** Powered by WebSocket and SockJS with STOMP protocol.
* **Groups & Direct Messaging:** Allows creating custom group chat rooms or sending private messages directly to other registered users.
* **Typing & Active Status:** Tracks currently active users and broadcasts real-time typing indicators.
* **Message Actions:** Edit and delete messages (within a 5-minute window), react with emojis, or pin/unpin messages to rooms.
* **Rich Attachments:** Supports sending files, audio recording notes, doodles (drawings), and links with automated web preview generation.
* **Disappearing Messages:** Automatically handles self-destructing messages based on a user-defined timer.
* **Self-Contained DB:** Uses an H2 in-memory database by default so it runs instantly without configuring an external database.

---

## 🛠️ Technology Stack

* **Backend Framework:** Spring Boot 2.5.5, Spring Web, Spring Security, Spring WebSocket
* **Database & ORM:** Spring Data JPA, Hibernate, H2 Database (with MySQL compatibility mode)
* **Build System:** Maven 3.x
* **Java Version:** Java 11

---

## 📋 API Registry

### REST API Endpoints (`/api/**`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Register a new username and password | No |
| `POST` | `/api/login` | Login and establish HTTP session | No |
| `POST` | `/api/firebase-login` | Synchronize/login user authenticated via Firebase Google Sign-In | No |
| `POST` | `/api/firebase-register` | Register a Firebase Google user on the backend | No |
| `POST` | `/api/logout` | Logout and invalidate session | Yes |
| `GET` | `/api/me` | Retrieve the currently logged-in user profile | Yes |
| `GET` | `/api/history` | Retrieve public chat history | Yes |
| `GET` | `/api/history/{roomId}` | Retrieve group room message history | Yes |
| `GET` | `/api/history/private/{otherUser}` | Retrieve direct message history with another user | Yes |
| `GET` | `/api/users` | List all registered users | Yes |
| `GET` | `/api/rooms` | List all available group rooms | Yes |
| `GET` | `/api/active-users` | List currently active/connected users | Yes |
| `GET` | `/api/link-preview` | Fetch metadata (title, image) for a URL link preview | Yes |
| `GET` | `/api/translate` | Simulate message translation endpoint | Yes |
| `POST` | `/api/rooms` | Create a new group chat room | Yes |
| `POST` | `/api/rooms/{roomId}/description` | Edit a group room's description | Yes |
| `POST` | `/api/rooms/{roomId}/members` | Add new members to a group room | Yes |
| `POST` | `/api/rooms/{roomId}/exit` | Exit/leave a group room | Yes |
| `POST` | `/api/rooms/{roomId}/pin/{messageId}` | Pin a message in a group room | Yes |
| `POST` | `/api/rooms/{roomId}/unpin` | Unpin the pinned message in a group room | Yes |
| `POST` | `/api/history/clear` | Clear public chat history | Yes |
| `POST` | `/api/rooms/{roomId}/clear` | Clear room-specific message history | Yes |
| `POST` | `/api/users/delete-me` | Delete your user account | Yes |
| `POST` | `/api/messages/bulk-delete` | Delete selected messages (for me / for everyone) | Yes |
| `POST` | `/api/messages/{messageId}/react` | Add an emoji reaction to a message | Yes |
| `POST` | `/api/messages/support/notify` | Send phone/support notify request | Yes |
| `DELETE`| `/api/messages/self-destruct/{messageId}` | Destruct/delete a self-destructing message | Yes |

### WebSocket STOMP Mappings

* **Connection Endpoint:** `/ws` (with SockJS compatibility)
* **Application Prefix:** `/app`
* **Topic Broker:** `/topic`

| Message Destination | Description | Broker Subscription |
| :--- | :--- | :--- |
| `/app/chat.sendMessage` | Broadcast a new message to the chat | `/topic/public` |
| `/app/chat.addUser` | Notify join state and register active status | `/topic/public` |
| `/app/chat.typing` | Broadcast typing status of a user | `/topic/public` |
| `/app/chat.editMessage` | Broadcast edit details of a message | `/topic/public` |
| `/app/chat.deleteMessage` | Broadcast deletion notice of a message | `/topic/public` |

---

## ⚙️ Configuration Setup

Configure local settings or H2 database parameters in `src/main/resources/application.properties`:

```properties
server.port=${PORT:8080}
spring.datasource.url=jdbc:h2:mem:chatsphere;DB_CLOSE_DELAY=-1;MODE=MySQL
spring.datasource.username=sa
spring.datasource.password=
```
