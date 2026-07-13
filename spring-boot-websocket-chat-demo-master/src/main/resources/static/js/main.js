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
var deleteAccountLink = document.querySelector('#delete-account-link');
var clearChatBtn = document.querySelector('#clear-chat-btn');
var setBgBtn = document.querySelector('#set-bg-btn');
var chatBgInput = document.querySelector('#chat-bg-input');
var removeBgBtn = document.querySelector('#remove-bg-btn');

// State variables for enhancements
var currentRecipient = null; // null means public room, non-null is direct chat username
var mediaRecorder = null;
var audioChunks = [];
var isRecording = false;
var activeReplyMsg = null;
var attachedFile = null;

// Selectors for enhancements
var attachmentPreviewBar = document.querySelector('#attachment-preview-bar');
var attachmentPreviewName = document.querySelector('#attachment-preview-name');
var cancelAttachmentBtn = document.querySelector('#cancel-attachment-btn');
var attachBtn = document.querySelector('#attach-btn');
var fileAttachmentInput = document.querySelector('#file-attachment-input');
var recordVoiceBtn = document.querySelector('#record-voice-btn');
var micIcon = document.querySelector('#mic-icon');
var replyPreviewBar = document.querySelector('#reply-preview-bar');
var replyPreviewSender = document.querySelector('#reply-preview-sender');
var replyPreviewText = document.querySelector('#reply-preview-text');
var cancelReplyBtn = document.querySelector('#cancel-reply-btn');
var privateUsersList = document.querySelector('#private-users-list');

// Selectors for Doodle Modal
var doodleBtn = document.querySelector('#doodle-btn');
var doodleModal = document.querySelector('#doodle-modal');
var doodleCanvas = document.querySelector('#doodle-canvas');
var doodleColor = document.querySelector('#doodle-color');
var doodleSize = document.querySelector('#doodle-size');
var doodleSizeVal = document.querySelector('#doodle-size-val');
var doodleClearBtn = document.querySelector('#doodle-clear-btn');
var doodleSendBtn = document.querySelector('#doodle-send-btn');
var doodleCancelBtn = document.querySelector('#doodle-cancel-btn');

// Selectors for Disappearing Messages
var destructToggleBtn = document.querySelector('#destruct-toggle-btn');
var destructTimeSelect = document.querySelector('#destruct-time-select');

// Speech Recognition instance for transcribing voice notes
var speechRecognition = null;
var voiceTranscriptionText = "";



var selectionActionsBar = document.querySelector('#selection-actions-bar');
var selectAllCheckbox = document.querySelector('#select-all-checkbox');
var selectionCountSpan = document.querySelector('#selection-count');
var deleteSelectedBtn = document.querySelector('#delete-selected-btn');
var cancelSelectionBtn = document.querySelector('#cancel-selection-btn');

var deleteChoiceModal = document.querySelector('#delete-choice-modal');
var deleteForMeBtn = document.querySelector('#delete-for-me-btn');
var deleteForEveryoneBtn = document.querySelector('#delete-for-everyone-btn');
var cancelDeleteModalBtn = document.querySelector('#cancel-delete-modal-btn');
var deleteModalWarning = document.querySelector('#delete-modal-warning');

var isSelectionMode = false;
var selectedMessageIds = new Set();
var activeDeletionIds = [];

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

// Group Info Modal Selectors
var roomInfoBtn = document.querySelector('#room-info-btn');
var groupInfoModal = document.querySelector('#group-info-modal');
var closeInfoModal = document.querySelector('#close-info-modal');
var infoGroupTitle = document.querySelector('#info-group-title');
var groupDescText = document.querySelector('#group-desc-text');
var editDescBtn = document.querySelector('#edit-desc-btn');
var groupDescDisplayWrapper = document.querySelector('#group-desc-display-wrapper');
var groupDescEditWrapper = document.querySelector('#group-desc-edit-wrapper');
var groupDescInput = document.querySelector('#group-desc-input');
var cancelDescBtn = document.querySelector('#cancel-desc-btn');
var saveDescBtn = document.querySelector('#save-desc-btn');
var infoMembersList = document.querySelector('#info-members-list');
var infoAddMembersList = document.querySelector('#info-add-members-list');
var submitAddMembersBtn = document.querySelector('#submit-add-members-btn');
var exitGroupBtn = document.querySelector('#exit-group-btn');

// Pinned Message Selectors
var pinnedMessageBanner = document.querySelector('#pinned-message-banner');
var pinnedMessageText = document.querySelector('#pinned-message-text');
var unpinMessageBtn = document.querySelector('#unpin-message-btn');

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

// Handle Delete Account Click
if (deleteAccountLink) {
    deleteAccountLink.addEventListener('click', function(event) {
        event.preventDefault();
        
        if (confirm('Are you sure you want to delete your account forever? This action cannot be undone.')) {
            fetch('/api/users/delete-me', { method: 'POST' })
                .then(function(response) {
                    if (response.ok) {
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
                        
                        alert('Your account has been deleted forever.');
                    } else {
                        alert('Could not delete account. Please try again.');
                    }
                })
                .catch(function(err) {
                    console.error('Delete account error:', err);
                    alert('Error communicating with server.');
                });
        }
    });
}

// Handle Clear Chat Click
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', function(event) {
        event.preventDefault();
        
        var targetRoomName = currentRoomId ? 'this custom group' : 'the public group';
        if (confirm('Are you sure you want to clear all chat messages in ' + targetRoomName + '? This will delete them for everyone.')) {
            var url = currentRoomId ? '/api/rooms/' + currentRoomId + '/clear' : '/api/history/clear';
            fetch(url, { method: 'POST' })
                .then(function(response) {
                    if (!response.ok) {
                        alert('Could not clear chat history.');
                    }
                })
                .catch(function(err) {
                    console.error('Clear chat error:', err);
                });
        }
    });
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
            loadPrivateContacts();
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

    if((messageContent || attachedFile) && stompClient) {
        var destructVal = parseInt(destructTimeSelect ? destructTimeSelect.value : "0", 10);
        var chatMessage = {
            sender: username,
            roomId: currentRecipient ? null : currentRoomId,
            recipient: currentRecipient,
            destructDuration: destructVal > 0 ? destructVal : null
        };

        if (attachedFile) {
            chatMessage.type = 'FILE';
            chatMessage.fileName = attachedFile.name;
            chatMessage.content = attachedFile.data;
            chatMessage.caption = messageInput.value;
        } else {
            chatMessage.type = 'CHAT';
            chatMessage.content = messageInput.value;
        }

        if (activeReplyMsg) {
            chatMessage.replyToId = activeReplyMsg.id;
            chatMessage.replyToSender = activeReplyMsg.sender;
            chatMessage.replyToContent = activeReplyMsg.content;
        }

        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';

        if (attachedFile) {
            attachedFile = null;
            if (attachmentPreviewBar) {
                attachmentPreviewBar.classList.add('hidden');
            }
        }

        if (destructTimeSelect) {
            destructTimeSelect.value = "0";
            destructTimeSelect.classList.add('hidden');
        }

        if (replyPreviewBar) {
            replyPreviewBar.classList.add('hidden');
        }
        activeReplyMsg = null;
        
        // Immediately stop typing indicator on send
        clearTimeout(typingTimeout);
        if (isTyping) {
            stompClient.send("/app/chat.typing", {}, JSON.stringify({
                sender: username,
                type: 'TYPING',
                content: 'STOP',
                roomId: currentRecipient ? null : currentRoomId,
                recipient: currentRecipient
            }));
            isTyping = false;
        }
    }
    if (event) event.preventDefault();
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

        // Prepend checkbox for selection mode
        if (message.id) {
            var selectCheckbox = document.createElement('input');
            selectCheckbox.type = 'checkbox';
            selectCheckbox.classList.add('message-select-checkbox');
            selectCheckbox.style.display = 'none';
            selectCheckbox.style.marginRight = '10px';
            selectCheckbox.style.cursor = 'pointer';
            selectCheckbox.style.width = '16px';
            selectCheckbox.style.height = '16px';
            selectCheckbox.addEventListener('change', function() {
                toggleMessageSelection(messageElement, message.id);
            });
            messageElement.appendChild(selectCheckbox);
        }

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

        // Add Edit, Delete and Pin action controls
        if (message.id) {
            var actionsDiv = document.createElement('div');
            actionsDiv.classList.add('message-actions');
            
            var isAuthor = message.sender === username;
            var editBtn = null;
            var deleteBtn = null;
            
            if (isAuthor) {
                editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.classList.add('edit-msg-btn');
                editBtn.addEventListener('click', function() {
                    initiateEditMessage(message.id);
                });
                actionsDiv.appendChild(editBtn);
            }
            
            deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-msg-btn');
            deleteBtn.addEventListener('click', function() {
                requestDeleteMessage(message.id, isAuthor);
            });
            
            var replyBtn = document.createElement('button');
            replyBtn.textContent = 'Reply';
            replyBtn.classList.add('pin-msg-btn');
            replyBtn.addEventListener('click', function() {
                initiateReply(message.id, message.sender, message.content);
            });
            
            actionsDiv.appendChild(editBtn || document.createComment(""));
            actionsDiv.appendChild(deleteBtn);
            actionsDiv.appendChild(replyBtn);

            var reactBtn = document.createElement('button');
            reactBtn.textContent = 'React';
            reactBtn.classList.add('pin-msg-btn');
            reactBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                showReactionPopover(message.id, reactBtn);
            });
            actionsDiv.appendChild(reactBtn);

            var translateBtn = document.createElement('button');
            translateBtn.textContent = 'Translate';
            translateBtn.classList.add('pin-msg-btn');
            translateBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                showTranslationMenu(message.content, messageElement, translateBtn);
            });
            actionsDiv.appendChild(translateBtn);
            
            if (currentRoomId !== null) {
                var pinBtn = document.createElement('button');
                pinBtn.textContent = 'Pin';
                pinBtn.classList.add('pin-msg-btn');
                pinBtn.addEventListener('click', function() {
                    requestPinMessage(message.id);
                });
                actionsDiv.appendChild(pinBtn);
            }
            
            if (actionsDiv.children.length > 0) {
                messageElement.appendChild(actionsDiv);
                
                if (isAuthor) {
                    var sendTime = message.createdAt || Date.now();
                    var remainingTime = 5 * 60 * 1000 - (Date.now() - sendTime);
                    if (remainingTime > 0) {
                        setTimeout(function() {
                            if (editBtn) editBtn.remove();
                            if (deleteBtn) deleteBtn.remove();
                        }, remainingTime);
                    } else {
                        if (editBtn) editBtn.remove();
                        if (deleteBtn) deleteBtn.remove();
                    }
                }
            }
        }
    }

    if (message.replyToId) {
        var replyDiv = document.createElement('div');
        replyDiv.style.backgroundColor = 'rgba(0,0,0,0.06)';
        replyDiv.style.borderLeft = '3px solid var(--primary-color)';
        replyDiv.style.padding = '5px 8px';
        replyDiv.style.borderRadius = '3px';
        replyDiv.style.margin = '5px 0';
        replyDiv.style.fontSize = '12px';
        replyDiv.style.cursor = 'pointer';

        var rSender = document.createElement('div');
        rSender.textContent = message.replyToSender;
        rSender.style.fontWeight = 'bold';
        rSender.style.color = 'var(--primary-color)';
        replyDiv.appendChild(rSender);

        var rText = document.createElement('div');
        rText.textContent = message.replyToContent;
        rText.style.color = '#555';
        rText.style.whiteSpace = 'nowrap';
        rText.style.overflow = 'hidden';
        rText.style.textOverflow = 'ellipsis';
        replyDiv.appendChild(rText);

        replyDiv.addEventListener('click', function() {
            var original = document.querySelector('li[data-id="' + message.replyToId + '"]');
            if (original) {
                original.scrollIntoView({ behavior: 'smooth', block: 'center' });
                original.style.transition = 'background-color 0.3s';
                var oldBg = original.style.backgroundColor;
                original.style.backgroundColor = 'rgba(18, 143, 242, 0.2)';
                setTimeout(function() {
                    original.style.backgroundColor = oldBg;
                }, 1000);
            } else {
                alert('Original message was deleted or is not loaded in this session.');
            }
        });
        messageElement.appendChild(replyDiv);
    }

    if (message.type === 'VOICE') {
        var audioEl = document.createElement('audio');
        audioEl.src = message.content;
        audioEl.controls = true;
        audioEl.style.display = 'block';
        audioEl.style.marginTop = '5px';
        audioEl.style.maxWidth = '100%';
        messageElement.appendChild(audioEl);
    } else if (message.type === 'FILE') {
        var isImage = /\.(jpg|jpeg|png|gif)$/i.test(message.fileName) || (message.content && message.content.startsWith('data:image'));
        if (isImage) {
            var imgEl = document.createElement('img');
            imgEl.src = message.content;
            imgEl.style.maxWidth = '250px';
            imgEl.style.maxHeight = '250px';
            imgEl.style.borderRadius = '8px';
            imgEl.style.display = 'block';
            imgEl.style.marginTop = '8px';
            imgEl.style.cursor = 'pointer';
            imgEl.addEventListener('click', function() {
                var win = window.open();
                win.document.write('<img src="' + message.content + '" style="max-width:100%; height:auto;" />');
            });
            messageElement.appendChild(imgEl);

            var caption = document.createElement('div');
            caption.textContent = message.fileName;
            caption.style.fontSize = '11px';
            caption.style.color = '#888';
            caption.style.marginTop = '3px';
            messageElement.appendChild(caption);
        } else {
            var card = document.createElement('div');
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.gap = '8px';
            card.style.padding = '8px 12px';
            card.style.backgroundColor = 'rgba(0,0,0,0.05)';
            card.style.borderRadius = '6px';
            card.style.marginTop = '5px';
            card.style.maxWidth = '250px';

            var icon = document.createElement('span');
            icon.textContent = '📄';
            icon.style.fontSize = '24px';
            card.appendChild(icon);

            var info = document.createElement('div');
            info.style.overflow = 'hidden';
            var nameLink = document.createElement('a');
            nameLink.href = message.content;
            nameLink.download = message.fileName;
            nameLink.textContent = message.fileName;
            nameLink.style.fontWeight = 'bold';
            nameLink.style.textDecoration = 'underline';
            nameLink.style.fontSize = '13px';
            nameLink.style.display = 'block';
            nameLink.style.overflow = 'hidden';
            nameLink.style.textOverflow = 'ellipsis';
            nameLink.style.whiteSpace = 'nowrap';
            info.appendChild(nameLink);

            var size = document.createElement('span');
            size.textContent = 'Click to download';
            size.style.fontSize = '11px';
            size.style.color = '#888';
            info.appendChild(size);

            card.appendChild(info);
            messageElement.appendChild(card);
        }

        if (message.caption) {
            var captionText = document.createElement('p');
            captionText.textContent = message.caption;
            captionText.style.marginTop = '8px';
            captionText.style.fontSize = '14px';

            var urls = detectURLs(message.caption);
            if (urls && urls.length > 0) {
                createLinkPreviewCard(urls[0], messageElement);
            }
            messageElement.appendChild(captionText);
        }
    } else {
        var textElement = document.createElement('p');
        var urls = detectURLs(message.content);
        if (urls && urls.length > 0) {
            var messageText = document.createTextNode(message.content);
            textElement.appendChild(messageText);
            messageElement.appendChild(textElement);
            createLinkPreviewCard(urls[0], messageElement);
        } else {
            var messageText = document.createTextNode(message.content);
            textElement.appendChild(messageText);
            messageElement.appendChild(textElement);
        }
    }

    // Emoji Reactions Container
    var reactionsContainer = document.createElement('div');
    reactionsContainer.classList.add('message-reactions-container');
    messageElement.appendChild(reactionsContainer);
    if (message.reactions) {
        drawReactions(reactionsContainer, message.id, message.reactions);
    }

    // Voice transcription trigger
    if (message.type === 'VOICE' && message.transcription) {
        var transBtn = document.createElement('button');
        transBtn.textContent = 'Show Transcript 📝';
        transBtn.classList.add('transcript-btn');
        var transText = document.createElement('div');
        transText.classList.add('transcript-text');
        transText.textContent = message.transcription;
        transText.style.display = 'none';

        transBtn.addEventListener('click', function() {
            if (transText.style.display === 'none') {
                transText.style.display = 'block';
                transBtn.textContent = 'Hide Transcript 🙈';
            } else {
                transText.style.display = 'none';
                transBtn.textContent = 'Show Transcript 📝';
            }
        });
        messageElement.appendChild(transBtn);
        messageElement.appendChild(transText);
    }

    // Disappearing Messages Self-Destruct Trigger
    if (message.id && message.destructDuration && message.destructDuration > 0) {
        initSelfDestruct(messageElement, message.id, message.destructDuration, message.createdAt);
    }

    // Setup Long-press event listeners for selection mode
    if (message.id && message.type !== 'JOIN' && message.type !== 'LEAVE') {
        var pressTimer;
        
        var startPress = function(e) {
            if (e.target.closest('.message-actions') || e.target.closest('input[type="checkbox"]') || isSelectionMode) return;
            pressTimer = window.setTimeout(function() {
                enterSelectionMode();
                toggleMessageSelection(messageElement, message.id);
            }, 800);
        };
        
        var cancelPress = function() {
            if (pressTimer) window.clearTimeout(pressTimer);
        };
        
        messageElement.addEventListener('touchstart', startPress, { passive: true });
        messageElement.addEventListener('touchend', cancelPress);
        messageElement.addEventListener('touchmove', cancelPress);
        
        messageElement.addEventListener('mousedown', startPress);
        messageElement.addEventListener('mouseup', cancelPress);
        messageElement.addEventListener('mouseleave', cancelPress);
        
        messageElement.addEventListener('click', function(e) {
            if (e.target.closest('.message-actions') || e.target.closest('input[type="checkbox"]')) return;
            if (isSelectionMode) {
                toggleMessageSelection(messageElement, message.id);
            }
        });
    }

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    if (message.type === 'REACTION_UPDATE') {
        var messageLi = document.querySelector('li[data-id="' + message.id + '"]');
        if (messageLi) {
            updateReactionUI(messageLi, message.content);
        }
        return;
    }

    if (message.recipient) {
        if (message.recipient !== username && message.sender !== username) {
            return;
        }

        var otherUser = message.sender === username ? message.recipient : message.sender;
        if (currentRecipient === otherUser) {
            renderMessage(message);
        } else {
            var key = 'private_' + otherUser.toLowerCase();
            unreadCounts[key] = (unreadCounts[key] || 0) + 1;
            renderPrivateUsersList();
        }
        return;
    }

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

    if (message.type === 'BULK_DELETE') {
        if (message.content) {
            var ids = message.content.split(',');
            ids.forEach(function(id) {
                var messageLi = document.querySelector('li[data-id="' + id + '"]');
                if (messageLi) {
                    messageLi.remove();
                }
            });
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

    if (message.type === 'CLEAR') {
        if (message.roomId === currentRoomId) {
            messageArea.innerHTML = '';
        }
        return;
    }

    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        if (message.type === 'JOIN' && message.content && message.content.indexOf('ROOM_CREATED:') === 0) {
            var parts = message.content.split(':');
            var membersList = parts[3] ? parts[3].split(',') : [];
            if (membersList.indexOf(username.toLowerCase()) !== -1) {
                loadMyRooms();
            }
            return;
        }

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

    if (message.type === 'CHAT' || message.type === 'VOICE' || message.type === 'FILE') {
        if (currentRecipient !== null) {
            var key = message.roomId === null ? 'public' : message.roomId;
            unreadCounts[key] = (unreadCounts[key] || 0) + 1;
            renderRoomsList();
            return;
        }

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
    currentRecipient = null;
    currentRoomId = roomId;
    
    var key = roomId === null ? 'public' : roomId;
    unreadCounts[key] = 0;
    
    renderRoomsList();
    renderPrivateUsersList();
    
    var container = document.querySelector('.chat-container');
    if (container) {
        container.classList.remove('sidebar-active');
    }
    
    var chatHeaderH2 = document.querySelector('.chat-header h2');
    if (chatHeaderH2) {
        chatHeaderH2.textContent = roomName;
    }
    
    var chatHeader = document.querySelector('.chat-header');
    if (roomId === null) {
        if (roomInfoBtn) roomInfoBtn.classList.add('hidden');
        if (chatHeader) chatHeader.style.cursor = 'default';
    } else {
        if (roomInfoBtn) roomInfoBtn.classList.remove('hidden');
        if (chatHeader) chatHeader.style.cursor = 'pointer';
    }
    
    var activeRoom = rooms.find(function(r) { return r.id === roomId; });
    if (roomId !== null && activeRoom && activeRoom.pinnedMessageContent) {
        if (pinnedMessageText) pinnedMessageText.textContent = activeRoom.pinnedMessageContent;
        if (pinnedMessageBanner) pinnedMessageBanner.classList.remove('hidden');
    } else {
        if (pinnedMessageBanner) pinnedMessageBanner.classList.add('hidden');
    }
    
    var historyUrl = roomId === null ? '/api/history' : '/api/history/' + roomId;
    
    fetch(historyUrl)
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(messages) {
                    messageArea.innerHTML = '';
                    
                    // Render Group Description at the top of the chat area
                    if (roomId !== null && activeRoom) {
                        var descLi = document.createElement('li');
                        descLi.classList.add('event-message');
                        descLi.style.backgroundColor = 'var(--border-color)';
                        descLi.style.padding = '10px 15px';
                        descLi.style.borderRadius = '8px';
                        descLi.style.margin = '10px auto';
                        descLi.style.maxWidth = '80%';
                        descLi.style.textAlign = 'center';
                        descLi.style.borderLeft = '4px solid var(--primary-color)';
                        descLi.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        
                        var titleSpan = document.createElement('span');
                        titleSpan.style.fontWeight = 'bold';
                        titleSpan.style.display = 'block';
                        titleSpan.style.marginBottom = '5px';
                        titleSpan.textContent = '📝 Group Description';
                        
                        var descText = document.createElement('span');
                        descText.textContent = activeRoom.description || "No description set yet. Click the header to add one!";
                        descText.style.fontStyle = 'italic';
                        
                        descLi.appendChild(titleSpan);
                        descLi.appendChild(descText);
                        messageArea.appendChild(descLi);
                    }
                    
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
    fetch('/api/me')
        .then(function(response) {
            if (response.ok) {
                username = storedUser;
                enterChatRoom(username);
            } else {
                sessionStorage.removeItem('chatUsername');
                usernamePage.classList.remove('hidden');
                chatPage.classList.add('hidden');
            }
        })
        .catch(function() {
            sessionStorage.removeItem('chatUsername');
            usernamePage.classList.remove('hidden');
            chatPage.classList.add('hidden');
        });
}

// Initialize Firebase (only if config is provided and configured)
if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
    firebase.initializeApp(firebaseConfig);
}

var googleLoginBtn = document.querySelector('#google-login-btn');
var firebaseIdToken = null; // Store idToken during registration flow

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
        if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined' || firebaseConfig.apiKey === 'YOUR_API_KEY') {
            showFeedback('Firebase is not configured yet. Please update js/firebase-config.js with your keys.', 'red');
            return;
        }

        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(function(result) {
                return result.user.getIdToken();
            })
            .then(function(idToken) {
                firebaseIdToken = idToken;
                return fetch('/api/firebase-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: idToken })
                });
            })
            .then(function(response) {
                return response.json().then(function(data) {
                    if (!response.ok) {
                        showFeedback(data.message || 'Google Login failed', 'red');
                        return;
                    }
                    
                    if (data.status === 'username_required') {
                        // Show Google Username selection screen
                        usernamePage.classList.add('hidden');
                        googleUsernamePage.classList.remove('hidden');
                        
                        var defaultName = data.googleName;
                        if (data.email && data.email.includes('@')) {
                            defaultName = data.email.split('@')[0];
                        }
                        googleNameInput.value = defaultName || '';
                    } else {
                        // Already registered, enter chat room directly
                        username = data.username;
                        sessionStorage.setItem('chatUsername', username);
                        enterChatRoom(username);
                    }
                });
            })
            .catch(function(err) {
                console.error('Google Auth Error:', err);
                showFeedback('Google Authentication error: ' + err.message, 'red');
            });
    });
}

if (googleUsernameForm) {
    googleUsernameForm.addEventListener('submit', function(event) {
        event.preventDefault();
        var chosenName = googleNameInput.value.trim();
        if (chosenName && firebaseIdToken) {
            fetch('/api/firebase-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: firebaseIdToken,
                    username: chosenName
                })
            })
            .then(function(response) {
                return response.json().then(function(data) {
                    if (response.ok) {
                        username = chosenName;
                        sessionStorage.setItem('chatUsername', username);
                        googleUsernamePage.classList.add('hidden');
                        enterChatRoom(username);
                    } else {
                        alert(data.message || 'Could not complete registration');
                    }
                });
            })
            .catch(function(err) {
                alert('Server error during registration');
            });
        }
    });
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

// Group Info Modal Helper Logic
function closeGroupInfoModal() {
    if (groupInfoModal) groupInfoModal.classList.add('hidden');
    if (groupDescEditWrapper) groupDescEditWrapper.classList.add('hidden');
    if (groupDescDisplayWrapper) groupDescDisplayWrapper.classList.remove('hidden');
}

if (closeInfoModal) closeInfoModal.addEventListener('click', closeGroupInfoModal);

if (roomInfoBtn) {
    roomInfoBtn.addEventListener('click', function() {
        if (currentRoomId === null) return;
        var activeRoom = rooms.find(function(r) { return r.id === currentRoomId; });
        if (!activeRoom) return;

        // 1. Title & Description
        infoGroupTitle.textContent = activeRoom.name;
        groupDescText.textContent = activeRoom.description || "No description provided.";
        groupDescInput.value = activeRoom.description || "";

        // 2. Render Members
        infoMembersList.innerHTML = '';
        if (activeRoom.members) {
            activeRoom.members.forEach(function(member) {
                var li = document.createElement('li');
                li.textContent = member;
                li.style.padding = '4px 0';
                li.style.borderBottom = '1px solid var(--border-color)';
                
                var isAdmin = activeRoom.createdBy && member.toLowerCase() === activeRoom.createdBy.toLowerCase();
                if (isAdmin) {
                    var badge = document.createElement('span');
                    badge.textContent = 'Group Admin';
                    badge.style.fontSize = '9px';
                    badge.style.backgroundColor = 'var(--primary-color)';
                    badge.style.color = '#fff';
                    badge.style.padding = '2px 4px';
                    badge.style.borderRadius = '3px';
                    badge.style.marginLeft = '8px';
                    li.appendChild(badge);
                }
                infoMembersList.appendChild(li);
            });
        }

        // 3. Load Add Members checkboxes (Registered users NOT in this room)
        fetch('/api/users')
            .then(function(response) {
                if (response.ok) {
                    return response.json().then(function(users) {
                        infoAddMembersList.innerHTML = '';
                        var activeMembersLower = (activeRoom.members || []).map(function(m) { return m.toLowerCase(); });
                        var notInRoomUsers = users.filter(function(u) {
                            return activeMembersLower.indexOf(u.toLowerCase()) === -1;
                        });

                        if (notInRoomUsers.length === 0) {
                            infoAddMembersList.innerHTML = '<div style="font-size:12px;color:#777;padding:5px 0;">All registered users are already members.</div>';
                            submitAddMembersBtn.style.display = 'none';
                        } else {
                            submitAddMembersBtn.style.display = 'inline-block';
                            notInRoomUsers.forEach(function(u) {
                                var label = document.createElement('label');
                                label.classList.add('checkbox-item');

                                var checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.value = u;
                                checkbox.name = 'info-new-members';

                                label.appendChild(checkbox);
                                label.appendChild(document.createTextNode(u));
                                infoAddMembersList.appendChild(label);
                            });
                        }
                    });
                }
            });

        groupInfoModal.classList.remove('hidden');
    });
}

if (editDescBtn) {
    editDescBtn.addEventListener('click', function() {
        groupDescDisplayWrapper.classList.add('hidden');
        groupDescEditWrapper.classList.remove('hidden');
        groupDescInput.focus();
    });
}

if (cancelDescBtn) {
    cancelDescBtn.addEventListener('click', function() {
        groupDescEditWrapper.classList.add('hidden');
        groupDescDisplayWrapper.classList.remove('hidden');
    });
}

if (saveDescBtn) {
    saveDescBtn.addEventListener('click', function() {
        var newDesc = groupDescInput.value.trim();
        fetch('/api/rooms/' + currentRoomId + '/description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: newDesc })
        })
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(updatedRoom) {
                    var idx = rooms.findIndex(function(r) { return r.id === currentRoomId; });
                    if (idx !== -1) {
                        rooms[idx].description = updatedRoom.description;
                    }
                    groupDescText.textContent = updatedRoom.description || "No description provided.";
                    groupDescEditWrapper.classList.add('hidden');
                    groupDescDisplayWrapper.classList.remove('hidden');
                });
            }
        });
    });
}

if (submitAddMembersBtn) {
    submitAddMembersBtn.addEventListener('click', function() {
        var selected = [];
        var checkboxes = infoAddMembersList.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(function(cb) {
            selected.push(cb.value);
        });
        if (selected.length === 0) return;

        fetch('/api/rooms/' + currentRoomId + '/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ members: selected })
        })
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(updatedRoom) {
                    var idx = rooms.findIndex(function(r) { return r.id === currentRoomId; });
                    if (idx !== -1) {
                        rooms[idx].members = updatedRoom.members;
                    }
                    roomInfoBtn.click();
                });
            }
        });
    });
}

if (exitGroupBtn) {
    exitGroupBtn.addEventListener('click', function() {
        if (confirm("Are you sure you want to exit this group?")) {
            fetch('/api/rooms/' + currentRoomId + '/exit', {
                method: 'POST'
            })
            .then(function(response) {
                if (response.ok) {
                    closeGroupInfoModal();
                    selectRoom(null, '01. Random Group');
                    loadMyRooms();
                }
            });
        }
    });
}

// Make the chat header clickable to open Group Details when inside a custom group
var chatHeaderElement = document.querySelector('.chat-header');
if (chatHeaderElement) {
    chatHeaderElement.addEventListener('click', function(e) {
        if (e.target.closest('#logout-link') || e.target.closest('#theme-toggle-chat') || e.target.closest('#room-info-btn')) {
            return;
        }
        if (currentRoomId !== null) {
            if (roomInfoBtn) roomInfoBtn.click();
        }
    });
}

// Pin/Unpin Message Helpers & Listeners
function requestPinMessage(messageId) {
    if (currentRoomId === null) return;
    fetch('/api/rooms/' + currentRoomId + '/pin/' + messageId, {
        method: 'POST'
    })
    .then(function(response) {
        if (response.ok) {
            return response.json().then(function(updatedRoom) {
                var idx = rooms.findIndex(function(r) { return r.id === currentRoomId; });
                if (idx !== -1) {
                    rooms[idx].pinnedMessageId = updatedRoom.pinnedMessageId;
                    rooms[idx].pinnedMessageContent = updatedRoom.pinnedMessageContent;
                }
                if (pinnedMessageText) pinnedMessageText.textContent = updatedRoom.pinnedMessageContent;
                if (pinnedMessageBanner) pinnedMessageBanner.classList.remove('hidden');
            });
        }
    });
}

if (unpinMessageBtn) {
    unpinMessageBtn.addEventListener('click', function() {
        if (currentRoomId === null) return;
        fetch('/api/rooms/' + currentRoomId + '/unpin', {
            method: 'POST'
        })
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(updatedRoom) {
                    var idx = rooms.findIndex(function(r) { return r.id === currentRoomId; });
                    if (idx !== -1) {
                        rooms[idx].pinnedMessageId = null;
                        rooms[idx].pinnedMessageContent = null;
                    }
                    if (pinnedMessageBanner) pinnedMessageBanner.classList.add('hidden');
                });
            }
        });
    });
}

// ==========================================
// SELECTION MODE & BULK DELETION LOGIC
// ==========================================

function enterSelectionMode() {
    isSelectionMode = true;
    selectedMessageIds.clear();
    selectionActionsBar.classList.remove('hidden');
    selectAllCheckbox.checked = false;
    updateSelectionCount();
    
    var checkboxes = document.querySelectorAll('.message-select-checkbox');
    checkboxes.forEach(function(cb) {
        cb.style.display = 'inline-block';
        cb.checked = false;
    });
    
    var actions = document.querySelectorAll('.message-actions');
    actions.forEach(function(act) {
        act.style.display = 'none';
    });
}

function exitSelectionMode() {
    isSelectionMode = false;
    selectedMessageIds.clear();
    selectionActionsBar.classList.add('hidden');
    
    var checkboxes = document.querySelectorAll('.message-select-checkbox');
    checkboxes.forEach(function(cb) {
        cb.style.display = 'none';
        cb.checked = false;
    });
    
    var actions = document.querySelectorAll('.message-actions');
    actions.forEach(function(act) {
        act.style.display = 'flex';
    });
    
    var lis = document.querySelectorAll('#messageArea li');
    lis.forEach(function(li) {
        li.style.backgroundColor = '';
    });
}

function toggleMessageSelection(li, id) {
    var cb = li.querySelector('.message-select-checkbox');
    if (selectedMessageIds.has(id)) {
        selectedMessageIds.delete(id);
        if (cb) cb.checked = false;
        li.style.backgroundColor = '';
    } else {
        selectedMessageIds.add(id);
        if (cb) cb.checked = true;
        li.style.backgroundColor = 'rgba(18, 143, 242, 0.1)';
    }
    updateSelectionCount();
}

function updateSelectionCount() {
    var count = selectedMessageIds.size;
    selectionCountSpan.textContent = count + ' selected';
    deleteSelectedBtn.disabled = count === 0;
    deleteSelectedBtn.style.opacity = count === 0 ? '0.5' : '1';
}

if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
        var checked = selectAllCheckbox.checked;
        var lis = document.querySelectorAll('#messageArea li[data-id]');
        lis.forEach(function(li) {
            var id = parseInt(li.getAttribute('data-id'));
            var cb = li.querySelector('.message-select-checkbox');
            if (checked) {
                selectedMessageIds.add(id);
                if (cb) cb.checked = true;
                li.style.backgroundColor = 'rgba(18, 143, 242, 0.1)';
            } else {
                selectedMessageIds.delete(id);
                if (cb) cb.checked = false;
                li.style.backgroundColor = '';
            }
        });
        updateSelectionCount();
    });
}

if (cancelSelectionBtn) {
    cancelSelectionBtn.addEventListener('click', function() {
        exitSelectionMode();
    });
}

if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', function() {
        var allOwn = true;
        selectedMessageIds.forEach(function(id) {
            var li = document.querySelector('li[data-id="' + id + '"]');
            if (li) {
                var senderElement = li.querySelector('span');
                if (senderElement && senderElement.textContent !== username) {
                    allOwn = false;
                }
            }
        });
        openDeleteChoiceModal(Array.from(selectedMessageIds), allOwn);
    });
}

function requestDeleteMessage(messageId, isAuthor) {
    if (isSelectionMode) exitSelectionMode();
    openDeleteChoiceModal([messageId], isAuthor);
}

function openDeleteChoiceModal(ids, allowDeleteForEveryone) {
    activeDeletionIds = ids;
    deleteChoiceModal.classList.remove('hidden');
    
    if (allowDeleteForEveryone) {
        deleteForEveryoneBtn.disabled = false;
        deleteForEveryoneBtn.style.opacity = '1';
        deleteForEveryoneBtn.style.pointerEvents = 'auto';
        deleteModalWarning.textContent = 'How would you like to delete the selected message(s)?';
        deleteModalWarning.style.color = '#666';
    } else {
        deleteForEveryoneBtn.disabled = true;
        deleteForEveryoneBtn.style.opacity = '0.5';
        deleteForEveryoneBtn.style.pointerEvents = 'none';
        deleteModalWarning.textContent = 'Delete for Everyone is only available for your own messages.';
        deleteModalWarning.style.color = '#d9534f';
    }
}

function closeDeleteChoiceModal() {
    deleteChoiceModal.classList.add('hidden');
    activeDeletionIds = [];
}

if (deleteForMeBtn) {
    deleteForMeBtn.addEventListener('click', function() {
        performBulkDelete(activeDeletionIds, 'FOR_ME');
        closeDeleteChoiceModal();
    });
}

if (deleteForEveryoneBtn) {
    deleteForEveryoneBtn.addEventListener('click', function() {
        performBulkDelete(activeDeletionIds, 'FOR_EVERYONE');
        closeDeleteChoiceModal();
    });
}

if (cancelDeleteModalBtn) {
    cancelDeleteModalBtn.addEventListener('click', function() {
        closeDeleteChoiceModal();
    });
}

function performBulkDelete(ids, type) {
    fetch('/api/messages/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: ids, deleteType: type })
    })
    .then(function(response) {
        if (response.ok) {
            if (type === 'FOR_ME') {
                ids.forEach(function(id) {
                    var li = document.querySelector('li[data-id="' + id + '"]');
                    if (li) li.remove();
                });
            }
            exitSelectionMode();
        } else {
            alert('Could not delete message(s).');
        }
    })
    .catch(function(err) {
        console.error('Delete error:', err);
    });
}

// ==========================================
// CUSTOM CHAT WALLPAPER LOGIC WITH DRAGGABLE CROPPER
// ==========================================

var cropModal = document.querySelector('#crop-modal');
var cropCanvas = document.querySelector('#crop-canvas');
var cropSaveBtn = document.querySelector('#crop-save-btn');
var cropCancelBtn = document.querySelector('#crop-cancel-btn');

var cropCtx = cropCanvas ? cropCanvas.getContext('2d') : null;
var sourceImg = null;
var isDrawingCrop = false;
var cropStart = { x: 0, y: 0 };
var cropEnd = { x: 0, y: 0 };
var selectedRect = null; // { x, y, w, h }

if (setBgBtn && chatBgInput) {
    setBgBtn.addEventListener('click', function() {
        chatBgInput.click();
    });

    chatBgInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            openCropModal(file);
            chatBgInput.value = ''; // Reset input to allow choosing same photo again
        }
    });
}

function openCropModal(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        sourceImg = new Image();
        sourceImg.onload = function() {
            var maxW = 500;
            var maxH = 350;
            var w = sourceImg.width;
            var h = sourceImg.height;

            if (w > maxW) {
                h = Math.round(h * (maxW / w));
                w = maxW;
            }
            if (h > maxH) {
                w = Math.round(w * (maxH / h));
                h = maxH;
            }

            cropCanvas.width = w;
            cropCanvas.height = h;

            cropCtx.drawImage(sourceImg, 0, 0, w, h);

            var selW = Math.round(w * 0.8);
            var selH = Math.round(h * 0.8);
            var selX = Math.round((w - selW) / 2);
            var selY = Math.round((h - selH) / 2);
            selectedRect = { x: selX, y: selY, w: selW, h: selH };

            drawCropOverlay();
            cropModal.classList.remove('hidden');
        };
        sourceImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function drawCropOverlay() {
    if (!cropCtx) return;
    cropCtx.drawImage(sourceImg, 0, 0, cropCanvas.width, cropCanvas.height);

    cropCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    cropCtx.fillRect(0, 0, cropCanvas.width, selectedRect.y);
    cropCtx.fillRect(0, selectedRect.y + selectedRect.h, cropCanvas.width, cropCanvas.height - (selectedRect.y + selectedRect.h));
    cropCtx.fillRect(0, selectedRect.y, selectedRect.x, selectedRect.h);
    cropCtx.fillRect(selectedRect.x + selectedRect.w, selectedRect.y, cropCanvas.width - (selectedRect.x + selectedRect.w), selectedRect.h);

    cropCtx.strokeStyle = '#128ff2';
    cropCtx.lineWidth = 2;
    cropCtx.setLineDash([4, 4]);
    cropCtx.strokeRect(selectedRect.x, selectedRect.y, selectedRect.w, selectedRect.h);
    cropCtx.setLineDash([]);
}

function getCanvasCoords(e) {
    if (!cropCanvas) return { x: 0, y: 0 };
    var rect = cropCanvas.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: Math.max(0, Math.min(cropCanvas.width, Math.round(clientX - rect.left))),
        y: Math.max(0, Math.min(cropCanvas.height, Math.round(clientY - rect.top)))
    };
}

function startCropDrag(e) {
    isDrawingCrop = true;
    var coords = getCanvasCoords(e);
    cropStart = coords;
    cropEnd = coords;
    selectedRect = { x: coords.x, y: coords.y, w: 0, h: 0 };
}

function moveCropDrag(e) {
    if (!isDrawingCrop) return;
    e.preventDefault();
    var coords = getCanvasCoords(e);
    cropEnd = coords;

    var x = Math.min(cropStart.x, cropEnd.x);
    var y = Math.min(cropStart.y, cropEnd.y);
    var w = Math.abs(cropStart.x - cropEnd.x);
    var h = Math.abs(cropStart.y - cropEnd.y);

    selectedRect = { x: x, y: y, w: w, h: h };
    drawCropOverlay();
}

function endCropDrag() {
    if (!isDrawingCrop) return;
    isDrawingCrop = false;
    if (selectedRect.w < 10 || selectedRect.h < 10) {
        selectedRect = { x: 0, y: 0, w: cropCanvas.width, h: cropCanvas.height };
        drawCropOverlay();
    }
}

if (cropCanvas) {
    cropCanvas.addEventListener('mousedown', startCropDrag);
    cropCanvas.addEventListener('mousemove', moveCropDrag);
    window.addEventListener('mouseup', endCropDrag);

    cropCanvas.addEventListener('touchstart', startCropDrag, { passive: false });
    cropCanvas.addEventListener('touchmove', moveCropDrag, { passive: false });
    window.addEventListener('touchend', endCropDrag);
}

if (cropCancelBtn) {
    cropCancelBtn.addEventListener('click', function() {
        cropModal.classList.add('hidden');
    });
}

if (cropSaveBtn) {
    cropSaveBtn.addEventListener('click', function() {
        if (!selectedRect || selectedRect.w === 0 || selectedRect.h === 0) return;

        var resultCanvas = document.createElement('canvas');
        resultCanvas.width = selectedRect.w;
        resultCanvas.height = selectedRect.h;
        var resultCtx = resultCanvas.getContext('2d');

        resultCtx.drawImage(
            cropCanvas,
            selectedRect.x, selectedRect.y, selectedRect.w, selectedRect.h,
            0, 0, selectedRect.w, selectedRect.h
        );

        var bgDataUrl = resultCanvas.toDataURL('image/jpeg', 0.8);
        applyWallpaper(bgDataUrl);
        localStorage.setItem('chatWallpaper', bgDataUrl);

        cropModal.classList.add('hidden');
    });
}

function applyWallpaper(bgDataUrl) {
    var chatMain = document.querySelector('.chat-main');
    if (chatMain) {
        chatMain.style.backgroundImage = 'url(' + bgDataUrl + ')';
        chatMain.style.backgroundSize = 'cover';
        chatMain.style.backgroundPosition = 'center';
        chatMain.style.backgroundRepeat = 'no-repeat';
    }
    var msgArea = document.querySelector('#messageArea');
    if (msgArea) {
        msgArea.style.backgroundColor = 'transparent';
    }
    if (removeBgBtn) {
        removeBgBtn.classList.remove('hidden');
    }
}

function removeWallpaper() {
    var chatMain = document.querySelector('.chat-main');
    if (chatMain) {
        chatMain.style.backgroundImage = '';
    }
    var msgArea = document.querySelector('#messageArea');
    if (msgArea) {
        msgArea.style.backgroundColor = '';
    }
    localStorage.removeItem('chatWallpaper');
    if (removeBgBtn) {
        removeBgBtn.classList.add('hidden');
    }
}

if (removeBgBtn) {
    removeBgBtn.addEventListener('click', function() {
        removeWallpaper();
    });
}

// Load saved wallpaper on page load
var savedWallpaper = localStorage.getItem('chatWallpaper');
if (savedWallpaper) {
    applyWallpaper(savedWallpaper);
} else {
    if (removeBgBtn) {
        removeBgBtn.classList.add('hidden');
    }
}

// ==========================================
// VOICE RECORDER, REPLIES, PREVIEWS & PRIVATE CHAT HELPERS
// ==========================================

// Quoted Replies
function initiateReply(id, sender, content) {
    activeReplyMsg = { id: id, sender: sender, content: content };
    if (replyPreviewSender) replyPreviewSender.textContent = sender;
    var preview = content;
    if (preview.length > 50) preview = preview.substring(0, 50) + '...';
    if (replyPreviewText) replyPreviewText.textContent = preview;
    if (replyPreviewBar) replyPreviewBar.classList.remove('hidden');
    messageInput.focus();
}

if (cancelReplyBtn) {
    cancelReplyBtn.addEventListener('click', function() {
        activeReplyMsg = null;
        if (replyPreviewBar) replyPreviewBar.classList.add('hidden');
    });
}

// File Attachment Trigger
if (attachBtn && fileAttachmentInput) {
    attachBtn.addEventListener('click', function() {
        fileAttachmentInput.click();
    });

    fileAttachmentInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            if (file.size > 2.5 * 1024 * 1024) {
                alert('File size exceeds the 2.5MB limit.');
                fileAttachmentInput.value = '';
                return;
            }

            var reader = new FileReader();
            reader.onload = function(event) {
                var fileBase64 = event.target.result;
                attachedFile = { name: file.name, data: fileBase64 };
                if (attachmentPreviewName) {
                    attachmentPreviewName.textContent = file.name;
                }
                if (attachmentPreviewBar) {
                    attachmentPreviewBar.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(file);
            fileAttachmentInput.value = '';
        }
    });
}

if (cancelAttachmentBtn) {
    cancelAttachmentBtn.addEventListener('click', function() {
        attachedFile = null;
        if (attachmentPreviewBar) {
            attachmentPreviewBar.classList.add('hidden');
        }
    });
}

function sendFileMessage(fileName, fileBase64) {
    if (stompClient) {
        var fileMessage = {
            sender: username,
            content: fileBase64,
            type: 'FILE',
            fileName: fileName,
            roomId: currentRecipient ? null : currentRoomId,
            recipient: currentRecipient
        };
        if (activeReplyMsg) {
            fileMessage.replyToId = activeReplyMsg.id;
            fileMessage.replyToSender = activeReplyMsg.sender;
            fileMessage.replyToContent = activeReplyMsg.content;
            activeReplyMsg = null;
            if (replyPreviewBar) replyPreviewBar.classList.add('hidden');
        }
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(fileMessage));
    }
}

// Voice Note Recording
if (recordVoiceBtn) {
    recordVoiceBtn.addEventListener('click', function() {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', function(event) {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', function() {
                var audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                var reader = new FileReader();
                reader.onload = function(event) {
                    var audioBase64 = event.target.result;
                    sendVoiceMessage(audioBase64, voiceTranscriptionText);
                };
                reader.readAsDataURL(audioBlob);

                stream.getTracks().forEach(function(track) {
                    track.stop();
                });
            });

            // Start Speech Recognition in parallel
            voiceTranscriptionText = "";
            var SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechClass) {
                speechRecognition = new SpeechClass();
                speechRecognition.continuous = true;
                speechRecognition.interimResults = false;
                speechRecognition.lang = 'en-US';

                speechRecognition.addEventListener('result', function(event) {
                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            voiceTranscriptionText += event.results[i][0].transcript + " ";
                        }
                    }
                });

                speechRecognition.addEventListener('error', function(err) {
                    console.error('Speech recognition error:', err);
                });

                speechRecognition.start();
            }

            mediaRecorder.start();
            isRecording = true;
            if (recordVoiceBtn) recordVoiceBtn.style.color = '#ff4743';
            if (micIcon) micIcon.style.transform = 'scale(1.2)';
            messageInput.placeholder = 'Recording voice message...';
            messageInput.disabled = true;
        })
        .catch(function(err) {
            alert('Could not access microphone: ' + err.message);
        });
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        if (speechRecognition) {
            speechRecognition.stop();
        }
        isRecording = false;
        if (recordVoiceBtn) recordVoiceBtn.style.color = '#666';
        if (micIcon) micIcon.style.transform = 'scale(1)';
        messageInput.placeholder = 'Type a message...';
        messageInput.disabled = false;
    }
}

function sendVoiceMessage(audioBase64, transcription) {
    if (stompClient) {
        var voiceMessage = {
            sender: username,
            content: audioBase64,
            type: 'VOICE',
            roomId: currentRecipient ? null : currentRoomId,
            recipient: currentRecipient,
            transcription: transcription ? transcription.trim() : null
        };
        if (activeReplyMsg) {
            voiceMessage.replyToId = activeReplyMsg.id;
            voiceMessage.replyToSender = activeReplyMsg.sender;
            voiceMessage.replyToContent = activeReplyMsg.content;
            activeReplyMsg = null;
            if (replyPreviewBar) replyPreviewBar.classList.add('hidden');
        }
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(voiceMessage));
    }
}

// Link Preview Rendering
function detectURLs(message) {
    var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return message.match(urlRegex);
}

function createLinkPreviewCard(url, parentElement) {
    fetch('/api/link-preview?url=' + encodeURIComponent(url))
        .then(function(res) {
            if (res.ok) return res.json();
            throw new Error();
        })
        .then(function(data) {
            if (!data.title && !data.description && !data.image) return;

            var card = document.createElement('div');
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '6px';
            card.style.padding = '10px';
            card.style.backgroundColor = 'rgba(0,0,0,0.04)';
            card.style.borderRadius = '8px';
            card.style.marginTop = '8px';
            card.style.borderLeft = '4px solid var(--primary-color)';
            card.style.maxWidth = '300px';
            card.style.cursor = 'pointer';

            card.addEventListener('click', function() {
                window.open(data.url, '_blank');
            });

            if (data.image) {
                var img = document.createElement('img');
                img.src = data.image;
                img.style.width = '100%';
                img.style.maxHeight = '150px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                card.appendChild(img);
            }

            var title = document.createElement('div');
            title.textContent = data.title || 'Link Preview';
            title.style.fontWeight = 'bold';
            title.style.fontSize = '13px';
            title.style.color = 'var(--primary-color)';
            card.appendChild(title);

            if (data.description) {
                var desc = document.createElement('div');
                desc.textContent = data.description;
                desc.style.fontSize = '11px';
                desc.style.color = '#555';
                desc.style.display = '-webkit-box';
                desc.style.webkitLineClamp = '2';
                desc.style.webkitBoxOrient = 'vertical';
                desc.style.overflow = 'hidden';
                card.appendChild(desc);
            }

            parentElement.appendChild(card);
            messageArea.scrollTop = messageArea.scrollHeight;
        })
        .catch(function(err) {
            // Ignore preview error silently
        });
}

// 1-on-1 Private Messaging Contacts switching
function loadPrivateContacts() {
    fetch('/api/users')
        .then(function(res) {
            if (res.ok) return res.json();
            return [];
        })
        .then(function(usersList) {
            var contacts = usersList.filter(function(u) {
                return u.toLowerCase() !== username.toLowerCase();
            });
            renderPrivateUsersList(contacts);
        })
        .catch(function(err) {
            console.error('Error loading private contacts:', err);
        });
}

function renderPrivateUsersList(contacts) {
    if (!contacts) {
        loadPrivateContacts();
        return;
    }

    if (!privateUsersList) return;
    privateUsersList.innerHTML = '';

    contacts.forEach(function(contact) {
        var li = document.createElement('li');
        li.style.padding = '10px 15px';
        li.style.cursor = 'pointer';
        li.style.borderBottom = '1px solid var(--border-color)';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        var nameSpan = document.createElement('span');
        nameSpan.textContent = contact;
        nameSpan.style.fontWeight = '500';
        li.appendChild(nameSpan);

        var key = 'private_' + contact.toLowerCase();
        var unread = unreadCounts[key] || 0;
        if (unread > 0) {
            var badge = document.createElement('span');
            badge.textContent = unread;
            badge.style.backgroundColor = 'var(--primary-color)';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.padding = '2px 6px';
            badge.style.fontSize = '10px';
            badge.style.fontWeight = 'bold';
            li.appendChild(badge);
        }

        if (currentRecipient && currentRecipient.toLowerCase() === contact.toLowerCase()) {
            li.style.backgroundColor = 'rgba(18, 143, 242, 0.1)';
        }

        li.addEventListener('click', function() {
            selectPrivateContact(contact);
        });

        privateUsersList.appendChild(li);
    });
}

function selectPrivateContact(contactName) {
    currentRoomId = null;
    currentRecipient = contactName;

    var container = document.querySelector('.chat-container');
    if (container) {
        container.classList.remove('sidebar-active');
    }

    var key = 'private_' + contactName.toLowerCase();
    unreadCounts[key] = 0;

    var headerTitle = document.querySelector('.chat-header h2');
    if (headerTitle) {
        headerTitle.textContent = '💬 ' + contactName;
    }

    if (roomInfoBtn) {
        roomInfoBtn.classList.add('hidden');
    }

    messageArea.innerHTML = '';

    var activeLis = document.querySelectorAll('#rooms-list li');
    activeLis.forEach(function(li) {
        li.style.backgroundColor = '';
    });

    renderPrivateUsersList();

    fetch('/api/history/private/' + encodeURIComponent(contactName))
        .then(function(res) {
            if (res.ok) return res.json();
            return [];
        })
        .then(function(historyMessages) {
            historyMessages.forEach(function(msg) {
                renderMessage(msg);
            });
        })
        .catch(function(err) {
            console.error('Error loading private history:', err);
        });
}

// Periodically sync contact list
setInterval(function() {
    if (username) {
        loadPrivateContacts();
    }
}, 10000);

// Sidebar Toggle Logic for Mobile Overlay
var sidebarToggleBtn = document.querySelector('#sidebar-toggle-btn');
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var container = document.querySelector('.chat-container');
        if (container) {
            container.classList.toggle('sidebar-active');
        }
    });
}

document.addEventListener('click', function(e) {
    var container = document.querySelector('.chat-container');
    var sidebar = document.querySelector('.sidebar');
    if (container && container.classList.contains('sidebar-active') && sidebar) {
        if (!sidebar.contains(e.target) && e.target !== sidebarToggleBtn && !sidebarToggleBtn.contains(e.target)) {
            container.classList.remove('sidebar-active');
        }
    }
});

// ==========================================
// UNIQUE EXTENDED FEATURES (SELF-DESTRUCT, DOODLE, TRANSLATE & REACTIONS)
// ==========================================

// 1. Self-Destruct / Disappearing Messages
if (destructToggleBtn && destructTimeSelect) {
    destructToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        destructTimeSelect.classList.toggle('hidden');
    });
}

function initSelfDestruct(messageElement, messageId, duration, createdAt) {
    var elapsed = Math.floor((Date.now() - createdAt) / 1000);
    var remaining = duration - elapsed;

    if (remaining <= 0) {
        messageElement.remove();
        requestDeleteMessageSilent(messageId);
        return;
    }

    var timerPill = document.createElement('span');
    timerPill.classList.add('destruct-timer-pill');
    timerPill.innerHTML = '⏱️ <span class="destruct-secs">' + remaining + '</span>s';

    var timestamp = messageElement.querySelector('.message-timestamp');
    if (timestamp) {
        timestamp.parentNode.insertBefore(timerPill, timestamp.nextSibling);
    } else {
        messageElement.appendChild(timerPill);
    }

    var countdownInterval = setInterval(function() {
        remaining--;
        var secSpan = timerPill.querySelector('.destruct-secs');
        if (secSpan) secSpan.textContent = remaining;

        if (remaining <= 3) {
            timerPill.classList.add('destruct-burning');
        }

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            messageElement.style.transition = 'opacity 0.8s, filter 0.8s';
            messageElement.style.opacity = '0';
            messageElement.style.filter = 'blur(10px)';
            setTimeout(function() {
                messageElement.remove();
                requestDeleteMessageSilent(messageId);
            }, 800);
        }
    }, 1000);
}

function requestDeleteMessageSilent(messageId) {
    fetch('/api/messages/self-destruct/' + messageId, {
        method: 'DELETE'
    }).catch(function(err) {
        console.error('Silent self-destruct delete failed:', err);
    });
}

// 2. Doodle Canvas Board
var isDrawingDoodle = false;
var doodleCtx = doodleCanvas ? doodleCanvas.getContext('2d') : null;

if (doodleBtn && doodleModal) {
    doodleBtn.addEventListener('click', function() {
        doodleModal.classList.remove('hidden');
        resetDoodleCanvas();
    });
}

if (doodleCancelBtn && doodleModal) {
    doodleCancelBtn.addEventListener('click', function() {
        doodleModal.classList.add('hidden');
    });
}

if (doodleClearBtn) {
    doodleClearBtn.addEventListener('click', function() {
        resetDoodleCanvas();
    });
}

if (doodleSize && doodleSizeVal) {
    doodleSize.addEventListener('input', function() {
        doodleSizeVal.textContent = doodleSize.value;
    });
}

function resetDoodleCanvas() {
    if (!doodleCtx || !doodleCanvas) return;
    doodleCtx.fillStyle = '#ffffff';
    doodleCtx.fillRect(0, 0, doodleCanvas.width, doodleCanvas.height);
}

if (doodleCanvas && doodleCtx) {
    doodleCanvas.addEventListener('mousedown', function(e) {
        isDrawingDoodle = true;
        doodleCtx.beginPath();
        var pos = getCanvasMousePos(e);
        doodleCtx.moveTo(pos.x, pos.y);
    });

    doodleCanvas.addEventListener('mousemove', function(e) {
        if (!isDrawingDoodle) return;
        var pos = getCanvasMousePos(e);
        doodleCtx.lineTo(pos.x, pos.y);
        doodleCtx.strokeStyle = doodleColor.value;
        doodleCtx.lineWidth = doodleSize.value;
        doodleCtx.lineCap = 'round';
        doodleCtx.stroke();
    });

    doodleCanvas.addEventListener('mouseup', function() {
        isDrawingDoodle = false;
    });

    doodleCanvas.addEventListener('mouseleave', function() {
        isDrawingDoodle = false;
    });

    doodleCanvas.addEventListener('touchstart', function(e) {
        isDrawingDoodle = true;
        doodleCtx.beginPath();
        var pos = getCanvasTouchPos(e);
        doodleCtx.moveTo(pos.x, pos.y);
        e.preventDefault();
    }, { passive: false });

    doodleCanvas.addEventListener('touchmove', function(e) {
        if (!isDrawingDoodle) return;
        var pos = getCanvasTouchPos(e);
        doodleCtx.lineTo(pos.x, pos.y);
        doodleCtx.strokeStyle = doodleColor.value;
        doodleCtx.lineWidth = doodleSize.value;
        doodleCtx.lineCap = 'round';
        doodleCtx.stroke();
        e.preventDefault();
    }, { passive: false });

    doodleCanvas.addEventListener('touchend', function(e) {
        isDrawingDoodle = false;
    });
}

function getCanvasMousePos(e) {
    var rect = doodleCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (doodleCanvas.width / rect.width),
        y: (e.clientY - rect.top) * (doodleCanvas.height / rect.height)
    };
}

function getCanvasTouchPos(e) {
    var rect = doodleCanvas.getBoundingClientRect();
    var touch = e.touches[0];
    return {
        x: (touch.clientX - rect.left) * (doodleCanvas.width / rect.width),
        y: (touch.clientY - rect.top) * (doodleCanvas.height / rect.height)
    };
}

if (doodleSendBtn) {
    doodleSendBtn.addEventListener('click', function() {
        if (!doodleCanvas) return;
        var dataUrl = doodleCanvas.toDataURL('image/png');
        sendFileMessage("doodle.png", dataUrl);
        doodleModal.classList.add('hidden');
    });
}

// 3. Emoji Reactions
function showReactionPopover(messageId, triggerBtn) {
    var existing = document.querySelector('.reaction-popover');
    if (existing) existing.remove();

    var popover = document.createElement('div');
    popover.classList.add('reaction-popover');

    var emojis = ['👍', '❤️', '😂', '😮', '😢'];
    emojis.forEach(function(emoji) {
        var span = document.createElement('span');
        span.classList.add('reaction-popover-emoji');
        span.textContent = emoji;
        span.addEventListener('click', function() {
            submitReaction(messageId, emoji);
            popover.remove();
        });
        popover.appendChild(span);
    });

    triggerBtn.parentNode.style.position = 'relative';
    triggerBtn.parentNode.appendChild(popover);

    setTimeout(function() {
        var dismiss = function() {
            popover.remove();
            document.removeEventListener('click', dismiss);
        };
        document.addEventListener('click', dismiss);
    }, 100);
}

function submitReaction(messageId, emoji) {
    fetch('/api/messages/' + messageId + '/react?emoji=' + encodeURIComponent(emoji), {
        method: 'POST'
    })
    .then(function(res) {
        if (res.ok) return res.json();
    })
    .then(function(reactionsMap) {
        var li = document.querySelector('li[data-id="' + messageId + '"]');
        if (li) {
            updateReactionUI(li, JSON.stringify(reactionsMap));
        }
    })
    .catch(function(err) {
        console.error('Reaction submission error:', err);
    });
}

function drawReactions(container, messageId, reactionsJson) {
    container.innerHTML = '';
    if (!reactionsJson || reactionsJson === '{}') return;

    try {
        var map = JSON.parse(reactionsJson);
        Object.keys(map).forEach(function(emoji) {
            var usersList = map[emoji] || [];
            if (usersList.length === 0) return;

            var pill = document.createElement('span');
            pill.classList.add('reaction-pill');
            pill.textContent = emoji + ' ' + usersList.length;
            pill.title = 'Reacted by: ' + usersList.join(', ');

            if (usersList.includes(username)) {
                pill.classList.add('active-react');
            }

            pill.addEventListener('click', function(e) {
                e.stopPropagation();
                submitReaction(messageId, emoji);
            });

            container.appendChild(pill);
        });
    } catch (e) {
        console.error('Error parsing reactions:', e);
    }
}

function updateReactionUI(messageLi, reactionsJson) {
    var container = messageLi.querySelector('.message-reactions-container');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('message-reactions-container');
        messageLi.appendChild(container);
    }
    var msgId = messageLi.getAttribute('data-id');
    drawReactions(container, msgId, reactionsJson);
}

// 4. Inline Translation
function showTranslationMenu(text, messageElement, buttonElement) {
    var existingMenu = messageElement.querySelector('.translate-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    var menu = document.createElement('select');
    menu.classList.add('translate-menu');
    menu.style.marginLeft = '8px';
    menu.style.fontSize = '12px';
    menu.style.borderRadius = '8px';
    menu.style.padding = '2px 5px';
    menu.style.border = '1px solid var(--border-color)';
    menu.style.background = 'var(--card-bg-color)';
    menu.style.color = 'var(--text-color)';
    menu.style.minHeight = 'auto';
    menu.style.width = 'auto';

    var placeholder = document.createElement('option');
    placeholder.textContent = 'To...';
    placeholder.value = '';
    menu.appendChild(placeholder);

    var langs = { 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'hi': 'Hindi', 'ja': 'Japanese' };
    Object.keys(langs).forEach(function(code) {
        var opt = document.createElement('option');
        opt.value = code;
        opt.textContent = langs[code];
        menu.appendChild(opt);
    });

    menu.addEventListener('change', function() {
        var targetLang = menu.value;
        if (!targetLang) return;

        menu.disabled = true;
        fetch('/api/translate?text=' + encodeURIComponent(text) + '&to=' + targetLang)
            .then(function(res) {
                if (res.ok) return res.json();
                throw new Error();
            })
            .then(function(data) {
                var existingTrans = messageElement.querySelector('.translated-block');
                if (existingTrans) existingTrans.remove();

                var block = document.createElement('div');
                block.classList.add('translated-block');
                block.style.fontSize = '12px';
                block.style.color = '#2ec4b6';
                block.style.marginTop = '5px';
                block.style.fontStyle = 'italic';
                block.innerHTML = '🌐 ' + data.translatedText;

                messageElement.appendChild(block);
                menu.remove();
            })
            .catch(function(err) {
                alert('Translation failed.');
                menu.disabled = false;
            });
    });

    buttonElement.parentNode.appendChild(menu);
}