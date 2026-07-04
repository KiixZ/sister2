const API_BASE_URL = '/api';
let currentUser = null;
let currentApiKey = null;
let currentSessionId = null;

window.onload = () => {
    const storedUser = localStorage.getItem('currentUser');
    const storedKey = localStorage.getItem('currentApiKey');
    if (storedUser && storedKey) {
        currentUser = storedUser;
        currentApiKey = storedKey;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'flex';
        fetchHistory();
    }
};

async function login() {
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    if (!usernameInput || !passwordInput) {
        errorMsg.textContent = 'Please enter both username and password.';
        errorMsg.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user_id;
            currentApiKey = data.api_key;
            localStorage.setItem('currentUser', currentUser);
            localStorage.setItem('currentApiKey', currentApiKey);
            
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('chat-container').style.display = 'flex';
            
            fetchHistory();
        } else {
            errorMsg.textContent = data.error || 'Login failed.';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMsg.textContent = 'Failed to connect to the server.';
        errorMsg.style.display = 'block';
    }
}

function logout() {
    currentUser = null;
    currentApiKey = null;
    currentSessionId = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentApiKey');
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('chat-container').style.display = 'none';
    document.getElementById('chat-box').innerHTML = '';
    document.getElementById('history-list').innerHTML = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user' : 'ai');
    
    // Simple way to handle newlines
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const inputField = document.getElementById('message-input');
    const message = inputField.value.trim();
    
    if (!message) return;

    appendMessage('user', message);
    inputField.value = '';
    
    // Add loading indicator
    const chatBox = document.getElementById('chat-box');
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'ai');
    loadingDiv.id = 'loading-msg';
    loadingDiv.textContent = 'Thinking...';
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': currentApiKey
            },
            body: JSON.stringify({ user_id: currentUser, message: message, session_id: currentSessionId })
        });

        const data = await response.json();
        
        // Remove loading indicator
        document.getElementById('loading-msg')?.remove();

        if (response.ok) {
            currentSessionId = data.session_id;
            appendMessage('ai', data.reply);
            fetchHistory(); // Refresh history
        } else {
            appendMessage('ai', `Error: ${data.error || 'Failed to get response'}`);
        }
    } catch (error) {
        console.error('Chat error:', error);
        document.getElementById('loading-msg')?.remove();
        appendMessage('ai', 'Error: Failed to communicate with the server.');
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function newChat() {
    currentSessionId = null;
    document.getElementById('chat-box').innerHTML = '';
    const inputField = document.getElementById('message-input');
    inputField.value = '';
    inputField.focus();
}

async function fetchHistory() {
    if (!currentUser || !currentApiKey) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/history/${currentUser}`, {
            headers: {
                'X-API-KEY': currentApiKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '';
            
            data.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.classList.add('history-item');
                if (item.session_id === currentSessionId) {
                    historyItem.style.backgroundColor = '#e0f7fa';
                }
                
                const time = new Date(item.request_time).toLocaleString();
                
                historyItem.innerHTML = `
                    <strong>${item.request_text}</strong>
                    <div style="color: #666; font-size: 11px;">${time}</div>
                `;
                historyItem.onclick = () => loadSession(item.session_id);
                
                historyList.appendChild(historyItem);
            });
        }
    } catch (error) {
        console.error('Failed to fetch history:', error);
    }
}

async function loadSession(sessionId) {
    if (!currentUser || !currentApiKey) return;
    currentSessionId = sessionId;
    
    try {
        const response = await fetch(`${API_BASE_URL}/history/${currentUser}/session/${sessionId}`, {
            headers: {
                'X-API-KEY': currentApiKey
            }
        });
        if (response.ok) {
            const messages = await response.json();
            const chatBox = document.getElementById('chat-box');
            chatBox.innerHTML = '';
            
            messages.forEach(msg => {
                appendMessage('user', msg.request_text);
                appendMessage('ai', msg.response_text);
            });
            fetchHistory(); // Highlight current session
        }
    } catch (error) {
        console.error('Failed to load session:', error);
    }
}
