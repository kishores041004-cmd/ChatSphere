'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var authTitle = document.querySelector('#auth-title');
var authSubmit = document.querySelector('#auth-submit');
var toggleMessage = document.querySelector('#toggle-message');
var toggleAuthMode = document.querySelector('#toggle-auth-mode');
var authFeedback = document.querySelector('#auth-feedback');
var loggedInUserSpan = document.querySelector('#logged-in-user');
var logoutLink = document.querySelector('#logout-link');

var googleUsernamePage = document.querySelector('#google-username-page');
var googleUsernameForm = document.querySelector('#googleUsernameForm');
var googleNameInput = document.querySelector('#google-name-input');

var tempId = Math.random().toString(36).substring(2, 10);
var stompClient = null;
var username = null;
var authMode = 'login'; // 'login' or 'register'

// Active Users Sidebar & Typing Selectors
var typingIndicator = document.querySelector('#typing-indicator');
var activeTypers = new Set();
var isTyping = false;
var typingTimeout = null;

// Group & Room Selectors & Variables
var roomsList = document.querySelector('#rooms-list');
var newGroupBtn = document.querySelector('#new-group-btn');
var newGroupModal = document.querySelector('#new-group-modal');
var closeGroupModal = document.querySelector('#close-group-modal');
var cancelGroupBtn = document.querySelector('#cancel-group-btn');
var newGroupForm = document.querySelector('#new-group-form');
var groupNameInput = document.querySelector('#group-name');
var membersCheckboxList = document.querySelector('#members-checkbox-list');

var currentRoomId = null; // null represents the Public Chat
var rooms = [];
var unreadCounts = {};

// Theme Management Logic
var themeToggleAuth = document.querySelector('#theme-toggle-auth');
var themeToggleChat = document.querySelector('#theme-toggle-chat');

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        updateThemeToggleIcons('dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        updateThemeToggleIcons('light');
    }
}

function updateThemeToggleIcons(theme) {
    var moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    var sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    
    var iconHtml = theme === 'dark' ? sunIcon : moonIcon;
    if (themeToggleAuth) themeToggleAuth.innerHTML = iconHtml;
    if (themeToggleChat) themeToggleChat.innerHTML = iconHtml;
}

var storedTheme = localStorage.getItem('theme');
if (storedTheme) {
    setTheme(storedTheme);
} else {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
}

function handleThemeToggle() {
    var isDark = document.body.classList.contains('dark-theme');
    setTheme(isDark ? 'light' : 'dark');
}

if (themeToggleAuth) themeToggleAuth.addEventListener('click', handleThemeToggle);
if (themeToggleChat) themeToggleChat.addEventListener('click', handleThemeToggle);

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

// Toggle between Login and Register Mode
toggleAuthMode.addEventListener('click', function(event) {
    event.preventDefault();
    authFeedback.textContent = '';
    
    if (authMode === 'login') {
        authMode = 'register';
        authTitle.textContent = 'Register for ChatSphere';
        authSubmit.textContent = 'Register';
        toggleMessage.textContent = 'Already have an account?';
        toggleAuthMode.textContent = 'Login here';
    } else {
        authMode = 'login';
        authTitle.textContent = 'Login to ChatSphere';
        authSubmit.textContent = 'Login';
        toggleMessage.textContent = "Don't have an account?";
        toggleAuthMode.textContent = 'Register here';
    }
});

// Toggle password visibility
var passwordInput = document.querySelector('#password');
var passwordToggleBtn = document.querySelector('#password-toggle-btn');

passwordToggleBtn.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggleBtn.innerHTML = '<svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    } else {
        passwordInput.type = 'password';
        passwordToggleBtn.innerHTML = '<svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    }
});

// Handle Login or Register Form Submit
usernameForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    var enteredUsername = document.querySelector('#name').value.trim();
    var enteredPassword = document.querySelector('#password').value;
    
    if (!enteredUsername || !enteredPassword) {
        showFeedback('Username and password are required', 'red');
        return;
    }

    var payload = {
        username: enteredUsername,
        password: enteredPassword
    };

    if (authMode === 'register') {
        // Register User
        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function(response) {
            return response.json().then(function(data) {
                if (response.ok) {
                    showFeedback('Registration successful! Please login.', 'green');
                    // Toggle to Login Mode
                    authMode = 'login';
                    authTitle.textContent = 'Login to ChatSphere';
                    authSubmit.textContent = 'Login';
                    toggleMessage.textContent = "Don't have an account?";
                    toggleAuthMode.textContent = 'Register here';
                    document.querySelector('#password').value = '';
                } else {
                    showFeedback(data.message || 'Registration failed', 'red');
                }
            });
        })
        .catch(function(err) {
            showFeedback('Server error. Please try again.', 'red');
        });
    } else {
        // Login User
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function(response) {
            return response.json().then(function(data) {
                if (response.ok) {
                    username = data.username;
                    sessionStorage.setItem('chatUsername', username);
                    enterChatRoom(username);
                } else {
                    showFeedback(data.message || 'Invalid username or password', 'red');
                }
            });
        })
        .catch(function(err) {
            showFeedback('Server error. Please try again.', 'red');
        });
    }
});

// Handle Logout Click
logoutLink.addEventListener('click', function(event) {
    event.preventDefault();
    
    fetch('/api/logout', { method: 'POST' })
        .then(function() {
            if (stompClient) {
                stompClient.disconnect();
            }
            sessionStorage.removeItem('chatUsername');
            username = null;
            messageArea.innerHTML = '';
            
            // Clear inputs
            document.querySelector('#name').value = '';
            document.querySelector('#password').value = '';
            authFeedback.textContent = '';
            
            // Show Login page
            chatPage.classList.add('hidden');
            googleUsernamePage.classList.add('hidden');
            usernamePage.classList.remove('hidden');
        });
});

function showFeedback(text, color) {
    authFeedback.textContent = text;
    authFeedback.style.color = color;
}

function enterChatRoom(user) {
    loggedInUserSpan.textContent = user;
    usernamePage.classList.add('hidden');
    chatPage.classList.remove('hidden');
    connectingElement.classList.remove('hidden');

    // Fetch and load chat history before establishing WebSocket connection
    fetch('/api/history')
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(messages) {
                    messageArea.innerHTML = '';
                    messages.forEach(function(msg) {
                        renderMessage(msg);
                    });
                });
            }
        })
        .catch(function(err) {
            console.error('Could not load chat history:', err);
        })
        .finally(function() {
            loadMyRooms();
            var socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);

            // Pass the username in the STOMP CONNECT headers to isolate tab sessions on the backend
            stompClient.connect({ username: user }, onConnected, onError);
        });
}

function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server to broadcast JOIN
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN', content: tempId})
    )

    connectingElement.classList.add('hidden');
}

function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();

    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT',
            roomId: currentRoomId
        };

        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
        
        // Immediately stop typing indicator on send
        clearTimeout(typingTimeout);
        if (isTyping) {
            stompClient.send("/app/chat.typing", {}, JSON.stringify({
                sender: username,
                type: 'TYPING',
                content: 'STOP',
                roomId: currentRoomId
            }));
            isTyping = false;
        }
    }
    event.preventDefault();
}

// Send Typing indicators
messageInput.addEventListener('input', function() {
    if (!isTyping && stompClient) {
        isTyping = true;
        stompClient.send("/app/chat.typing", {}, JSON.stringify({
            sender: username,
            type: 'TYPING',
            content: 'START',
            roomId: currentRoomId
        }));
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(function() {
        if (isTyping && stompClient) {
            stompClient.send("/app/chat.typing", {}, JSON.stringify({
                sender: username,
                type: 'TYPING',
                content: 'STOP',
                roomId: currentRoomId
            }));
            isTyping = false;
        }
    }, 2000);
});

function renderMessage(message) {
    var messageElement = document.createElement('li');
    if (message.id) {
        messageElement.setAttribute('data-id', message.id);
    }

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        var senderName = message.sender || 'Unknown';
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(senderName[0] || '?');
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(senderName);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(senderName);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);

        var timestampElement = document.createElement('span');
        timestampElement.classList.add('message-timestamp');
        var msgTime = message.createdAt ? new Date(message.createdAt) : new Date();
        timestampElement.textContent = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageElement.appendChild(timestampElement);

        // Add Edit and Delete action controls for current user's messages within 5 mins
        if (message.sender === username && message.id) {
            var actionsDiv = document.createElement('div');
            actionsDiv.classList.add('message-actions');
            
            var editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('edit-msg-btn');
            editBtn.addEventListener('click', function() {
                initiateEditMessage(message.id);
            });
            
            var deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-msg-btn');
            deleteBtn.addEventListener('click', function() {
                requestDeleteMessage(message.id);
            });
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            messageElement.appendChild(actionsDiv);
            
            var sendTime = message.createdAt || Date.now();
            var remainingTime = 5 * 60 * 1000 - (Date.now() - sendTime);
            if (remainingTime > 0) {
                setTimeout(function() {
                    if (actionsDiv) actionsDiv.remove();
                }, remainingTime);
            } else {
                actionsDiv.style.display = 'none';
            }
        }
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    if (message.type === 'TYPING') {
        if (message.roomId === currentRoomId) {
            handleTypingEvent(message);
        }
        return;
    }

    if (message.type === 'EDIT') {
        var messageLi = document.querySelector('li[data-id="' + message.id + '"]');
        if (messageLi) {
            var p = messageLi.querySelector('p');
            if (p) p.textContent = message.content;
        }
        return;
    }

    if (message.type === 'DELETE') {
        var messageLi = document.querySelector('li[data-id="' + message.id + '"]');
        if (messageLi) {
            messageLi.remove();
        }
        return;
    }

    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        if (message.type === 'JOIN' && message.content === tempId) {
            username = message.sender;
            sessionStorage.setItem('chatUsername', username);
            loggedInUserSpan.textContent = username;
        }
        if (currentRoomId === null) {
            renderMessage(message);
        }
        return;
    }

    if (message.type === 'CHAT') {
        if (message.roomId === currentRoomId) {
            renderMessage(message);
        } else {
            var key = message.roomId === null ? 'public' : message.roomId;
            unreadCounts[key] = (unreadCounts[key] || 0) + 1;
            renderRoomsList();
        }
    }
}

// Rooms & Groups Helpers
function loadMyRooms(callback) {
    fetch('/api/rooms')
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(loadedRooms) {
                    rooms = loadedRooms;
                    renderRoomsList();
                    if (callback) callback();
                });
            }
        })
        .catch(function(err) {
            console.error('Could not load rooms list:', err);
        });
}

function renderRoomsList() {
    if (!roomsList) return;
    roomsList.innerHTML = '';
    
    // 1. Public Chat Room
    var publicLi = document.createElement('li');
    if (currentRoomId === null) {
        publicLi.classList.add('active-room');
    }
    
    var nameWrapper = document.createElement('div');
    nameWrapper.classList.add('room-name-wrapper');
    
    var icon = document.createElement('div');
    icon.classList.add('room-icon');
    icon.textContent = '#';
    
    var nameText = document.createElement('span');
    nameText.textContent = '01. Random Group';
    
    nameWrapper.appendChild(icon);
    nameWrapper.appendChild(nameText);
    publicLi.appendChild(nameWrapper);
    
    if (unreadCounts['public'] && unreadCounts['public'] > 0) {
        var badge = document.createElement('span');
        badge.classList.add('room-unread-badge');
        badge.textContent = unreadCounts['public'];
        publicLi.appendChild(badge);
    }
    
    publicLi.addEventListener('click', function() {
        selectRoom(null, '01. Random Group');
    });
    roomsList.appendChild(publicLi);
    
    // 2. Custom Group Rooms
    rooms.forEach(function(room, index) {
        var roomLi = document.createElement('li');
        if (currentRoomId === room.id) {
            roomLi.classList.add('active-room');
        }
        
        var rNameWrapper = document.createElement('div');
        rNameWrapper.classList.add('room-name-wrapper');
        
        var rIcon = document.createElement('div');
        rIcon.classList.add('room-icon');
        rIcon.textContent = room.name[0] || 'G';
        
        var displayNum = String(index + 2).padStart(2, '0');
        var displayName = displayNum + '. ' + room.name;
        
        var rNameText = document.createElement('span');
        rNameText.textContent = displayName;
        
        rNameWrapper.appendChild(rIcon);
        rNameWrapper.appendChild(rNameText);
        roomLi.appendChild(rNameWrapper);
        
        if (unreadCounts[room.id] && unreadCounts[room.id] > 0) {
            var rBadge = document.createElement('span');
            rBadge.classList.add('room-unread-badge');
            rBadge.textContent = unreadCounts[room.id];
            roomLi.appendChild(rBadge);
        }
        
        roomLi.addEventListener('click', function() {
            selectRoom(room.id, displayName);
        });
        roomsList.appendChild(roomLi);
    });
}

function selectRoom(roomId, roomName) {
    currentRoomId = roomId;
    
    var key = roomId === null ? 'public' : roomId;
    unreadCounts[key] = 0;
    
    renderRoomsList();
    
    var chatHeaderH2 = document.querySelector('.chat-header h2');
    if (chatHeaderH2) {
        chatHeaderH2.textContent = roomName;
    }
    
    var historyUrl = roomId === null ? '/api/history' : '/api/history/' + roomId;
    
    fetch(historyUrl)
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(messages) {
                    messageArea.innerHTML = '';
                    messages.forEach(function(msg) {
                        renderMessage(msg);
                    });
                });
            }
        })
        .catch(function(err) {
            console.error('Could not load room chat history:', err);
        });
}

// Group Creation Modal Event Listeners
if (newGroupBtn) {
    newGroupBtn.addEventListener('click', function() {
        fetch('/api/users')
            .then(function(response) {
                if (response.ok) {
                    return response.json().then(function(users) {
                        membersCheckboxList.innerHTML = '';
                        var filteredUsers = users.filter(function(u) {
                            return u.toLowerCase() !== username.toLowerCase();
                        });
                        
                        if (filteredUsers.length === 0) {
                            membersCheckboxList.innerHTML = '<div style="font-size:12px;color:#777;padding:5px 0;">No other users registered yet.</div>';
                        } else {
                            filteredUsers.forEach(function(u) {
                                var label = document.createElement('label');
                                label.classList.add('checkbox-item');
                                
                                var checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.value = u;
                                checkbox.name = 'members';
                                
                                label.appendChild(checkbox);
                                label.appendChild(document.createTextNode(u));
                                membersCheckboxList.appendChild(label);
                            });
                        }
                        newGroupModal.classList.remove('hidden');
                    });
                }
            })
            .catch(function(err) {
                console.error('Could not load users list:', err);
            });
    });
}

function closeModal() {
    newGroupModal.classList.add('hidden');
    newGroupForm.reset();
}

if (closeGroupModal) closeGroupModal.addEventListener('click', closeModal);
if (cancelGroupBtn) cancelGroupBtn.addEventListener('click', closeModal);

if (newGroupForm) {
    newGroupForm.addEventListener('submit', function(event) {
        event.preventDefault();
        var roomName = groupNameInput.value.trim();
        if (!roomName) return;
        
        var selectedMembers = [];
        var checkboxes = membersCheckboxList.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(function(cb) {
            selectedMembers.push(cb.value);
        });
        
        fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: roomName,
                members: selectedMembers
            })
        })
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(newRoom) {
                    closeModal();
                    loadMyRooms(function() {
                        selectRoom(newRoom.id, newRoom.name);
                    });
                });
            } else {
                return response.json().then(function(err) {
                    alert(err.message || 'Could not create group');
                });
            }
        })
        .catch(function(err) {
            console.error('Error creating group:', err);
        });
    });
}

// Typing Indicator Helpers
function handleTypingEvent(message) {
    if (message.sender === username) return;
    
    if (message.content === 'START') {
        activeTypers.add(message.sender);
    } else {
        activeTypers.delete(message.sender);
    }
    
    renderTypingIndicator();
}

function renderTypingIndicator() {
    if (activeTypers.size === 0) {
        typingIndicator.classList.add('hidden-indicator');
        typingIndicator.textContent = '';
    } else {
        var typersArray = Array.from(activeTypers);
        var text = '';
        if (typersArray.length === 1) {
            text = typersArray[0] + ' is typing...';
        } else if (typersArray.length === 2) {
            text = typersArray[0] + ' and ' + typersArray[1] + ' are typing...';
        } else {
            text = 'Several people are typing...';
        }
        typingIndicator.textContent = text;
        typingIndicator.classList.remove('hidden-indicator');
    }
}

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }

    var index = Math.abs(hash % colors.length);
    return colors[index];
}

messageForm.addEventListener('submit', sendMessage, true);

// Check sessionStorage first to isolate tab-specific logins in the same browser session
var storedUser = sessionStorage.getItem('chatUsername');
if (storedUser) {
    username = storedUser;
    enterChatRoom(username);
} else {
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'google') {
        // If redirected from Google login, fetch the authenticated Google name
        fetch('/api/me')
            .then(function(response) {
                if (response.ok) {
                    return response.json().then(function(data) {
                        if (data.authMethod === 'google') {
                            // Show Google Username selection screen
                            usernamePage.classList.add('hidden');
                            googleUsernamePage.classList.remove('hidden');
                            
                            // Pre-fill with email prefix or googleName
                            var defaultName = data.googleName;
                            if (data.email && data.email.includes('@')) {
                                defaultName = data.email.split('@')[0];
                            }
                            googleNameInput.value = defaultName || '';
                            
                            // Listen for form submit
                            googleUsernameForm.addEventListener('submit', function(event) {
                                event.preventDefault();
                                var chosenName = googleNameInput.value.trim();
                                if (chosenName) {
                                    username = chosenName;
                                    sessionStorage.setItem('chatUsername', username);
                                    
                                    // Clean up the URL query parameter
                                    window.history.replaceState({}, document.title, window.location.pathname);
                                    
                                    googleUsernamePage.classList.add('hidden');
                                    enterChatRoom(username);
                                }
                            });
                        } else {
                            username = data.username;
                            sessionStorage.setItem('chatUsername', username);
                            // Clean up the URL query parameter
                            window.history.replaceState({}, document.title, window.location.pathname);
                            enterChatRoom(username);
                        }
                    });
                }
            });
    }
}

// Edit/Delete Message Operations
function initiateEditMessage(messageId) {
    var messageLi = document.querySelector('li[data-id="' + messageId + '"]');
    if (!messageLi) return;
    var p = messageLi.querySelector('p');
    var originalContent = p.textContent;
    
    var actions = messageLi.querySelector('.message-actions');
    if (actions) actions.style.display = 'none';
    
    p.style.display = 'none';
    
    var editContainer = document.createElement('div');
    editContainer.classList.add('edit-container');
    
    var input = document.createElement('input');
    input.type = 'text';
    input.value = originalContent;
    input.classList.add('form-control');
    
    var saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.classList.add('primary');
    saveBtn.style.padding = '5px 10px';
    saveBtn.style.marginRight = '5px';
    saveBtn.style.minHeight = 'auto';
    saveBtn.style.height = 'auto';
    saveBtn.style.width = 'auto';
    
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '5px 10px';
    cancelBtn.style.minHeight = 'auto';
    cancelBtn.style.height = 'auto';
    cancelBtn.style.width = 'auto';
    
    editContainer.appendChild(input);
    editContainer.appendChild(saveBtn);
    editContainer.appendChild(cancelBtn);
    
    messageLi.appendChild(editContainer);
    input.focus();
    
    saveBtn.addEventListener('click', function() {
        var newContent = input.value.trim();
        if (newContent && newContent !== originalContent) {
            stompClient.send("/app/chat.editMessage", {}, JSON.stringify({
                id: messageId,
                content: newContent,
                type: 'EDIT'
            }));
        }
        cleanupEdit();
    });
    
    cancelBtn.addEventListener('click', cleanupEdit);
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        } else if (e.key === 'Escape') {
            cancelBtn.click();
        }
    });
    
    function cleanupEdit() {
        editContainer.remove();
        p.style.display = 'block';
        if (actions) actions.style.display = 'inline-block';
    }
}

function requestDeleteMessage(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
        stompClient.send("/app/chat.deleteMessage", {}, JSON.stringify({
            id: messageId,
            type: 'DELETE'
        }));
    }
}