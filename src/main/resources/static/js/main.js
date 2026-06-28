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
            type: 'CHAT'
        };

        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

function renderMessage(message) {
    var messageElement = document.createElement('li');

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

    // Resolve server-assigned unique name for this tab
    if (message.type === 'JOIN' && message.content === tempId) {
        username = message.sender;
        sessionStorage.setItem('chatUsername', username);
        loggedInUserSpan.textContent = username;
    }

    renderMessage(message);
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