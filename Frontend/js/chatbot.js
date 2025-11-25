/**
 * Study Pro Global - Secure Chatbot Module
 * 
 * This module handles all chatbot functionality with proper XSS protection.
 * All user input is sanitized before display to prevent script injection.
 */

// =============================================================================
// SECURITY UTILITIES
// =============================================================================

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
    if (typeof str !== 'string') {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitize user input by removing potentially dangerous content
 * Uses iterative approach to handle nested/malformed tags
 * @param {string} input - The input to sanitize
 * @returns {string} - The sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Iteratively remove HTML tags to handle nested cases
    let sanitized = input;
    let previousLength;
    do {
        previousLength = sanitized.length;
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    } while (sanitized.length !== previousLength);
    
    return sanitized.trim();
}

// =============================================================================
// CHATBOT STATE
// =============================================================================

const ChatBot = {
    conversationId: null,
    isOpen: false,
    isLoading: false,
    messages: [],
    apiBaseUrl: '/api/v1/chat',
    
    // DOM Elements (will be initialized)
    elements: {
        container: null,
        toggleBtn: null,
        chatWindow: null,
        messagesContainer: null,
        inputField: null,
        sendBtn: null,
        closeBtn: null
    }
};

// =============================================================================
// DOM MANIPULATION (SECURE)
// =============================================================================

/**
 * Create a message element safely using textContent
 * @param {string} content - The message content
 * @param {string} role - Either 'user' or 'assistant'
 * @param {Date} timestamp - The message timestamp
 * @returns {HTMLElement} - The message element
 */
function createMessageElement(content, role, timestamp = new Date()) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    // SECURE: Use textContent instead of innerHTML to prevent XSS
    contentDiv.textContent = content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = formatTime(timestamp);
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    return messageDiv;
}

/**
 * Create a typing indicator element
 * @returns {HTMLElement} - The typing indicator element
 */
function createTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dotsDiv.appendChild(dot);
    }
    
    typingDiv.appendChild(dotsDiv);
    return typingDiv;
}

/**
 * Format timestamp for display
 * @param {Date} date - The date to format
 * @returns {string} - Formatted time string
 */
function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// =============================================================================
// CHATBOT UI FUNCTIONS
// =============================================================================

/**
 * Initialize the chatbot UI
 */
function initChatBot() {
    // Create chatbot container if it doesn't exist
    if (!document.getElementById('chatbot-container')) {
        createChatBotUI();
    }
    
    // Initialize element references
    ChatBot.elements.container = document.getElementById('chatbot-container');
    ChatBot.elements.toggleBtn = document.getElementById('chatbot-toggle');
    ChatBot.elements.chatWindow = document.getElementById('chatbot-window');
    ChatBot.elements.messagesContainer = document.getElementById('chatbot-messages');
    ChatBot.elements.inputField = document.getElementById('chatbot-input');
    ChatBot.elements.sendBtn = document.getElementById('chatbot-send');
    ChatBot.elements.closeBtn = document.getElementById('chatbot-close');
    
    // Attach event listeners
    attachEventListeners();
    
    // Add welcome message
    addWelcomeMessage();
}

/**
 * Create the chatbot UI elements
 */
function createChatBotUI() {
    const container = document.createElement('div');
    container.id = 'chatbot-container';
    container.className = 'chatbot-container';
    
    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'chatbot-toggle';
    toggleBtn.className = 'chatbot-toggle';
    toggleBtn.setAttribute('aria-label', 'Open chat');
    
    const toggleIcon = document.createElement('i');
    toggleIcon.className = 'fas fa-comments';
    toggleBtn.appendChild(toggleIcon);
    
    // Chat window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window';
    chatWindow.className = 'chatbot-window hidden';
    
    // Header
    const header = document.createElement('div');
    header.className = 'chatbot-header';
    
    const headerTitle = document.createElement('div');
    headerTitle.className = 'chatbot-title';
    
    const titleIcon = document.createElement('i');
    titleIcon.className = 'fas fa-robot';
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'Study Pro Assistant';
    
    headerTitle.appendChild(titleIcon);
    headerTitle.appendChild(titleSpan);
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'chatbot-close';
    closeBtn.className = 'chatbot-close';
    closeBtn.setAttribute('aria-label', 'Close chat');
    
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeBtn.appendChild(closeIcon);
    
    header.appendChild(headerTitle);
    header.appendChild(closeBtn);
    
    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'chatbot-messages';
    messagesContainer.className = 'chatbot-messages';
    
    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'chatbot-input-area';
    
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = 'chatbot-input';
    inputField.className = 'chatbot-input';
    inputField.placeholder = 'Type your message...';
    inputField.setAttribute('maxlength', '500');
    
    const sendBtn = document.createElement('button');
    sendBtn.id = 'chatbot-send';
    sendBtn.className = 'chatbot-send';
    sendBtn.setAttribute('aria-label', 'Send message');
    
    const sendIcon = document.createElement('i');
    sendIcon.className = 'fas fa-paper-plane';
    sendBtn.appendChild(sendIcon);
    
    inputArea.appendChild(inputField);
    inputArea.appendChild(sendBtn);
    
    // Assemble chat window
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputArea);
    
    // Assemble container
    container.appendChild(toggleBtn);
    container.appendChild(chatWindow);
    
    document.body.appendChild(container);
}

/**
 * Attach event listeners to chatbot elements
 */
function attachEventListeners() {
    // Toggle button click
    ChatBot.elements.toggleBtn.addEventListener('click', toggleChatWindow);
    
    // Close button click
    ChatBot.elements.closeBtn.addEventListener('click', closeChatWindow);
    
    // Send button click
    ChatBot.elements.sendBtn.addEventListener('click', handleSendMessage);
    
    // Enter key press in input
    ChatBot.elements.inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Input validation (limit characters and prevent XSS)
    ChatBot.elements.inputField.addEventListener('input', (e) => {
        // Limit input length
        if (e.target.value.length > 500) {
            e.target.value = e.target.value.substring(0, 500);
        }
    });
}

/**
 * Toggle the chat window open/closed
 */
function toggleChatWindow() {
    ChatBot.isOpen = !ChatBot.isOpen;
    
    if (ChatBot.isOpen) {
        ChatBot.elements.chatWindow.classList.remove('hidden');
        ChatBot.elements.toggleBtn.classList.add('active');
        ChatBot.elements.inputField.focus();
    } else {
        ChatBot.elements.chatWindow.classList.add('hidden');
        ChatBot.elements.toggleBtn.classList.remove('active');
    }
}

/**
 * Close the chat window
 */
function closeChatWindow() {
    ChatBot.isOpen = false;
    ChatBot.elements.chatWindow.classList.add('hidden');
    ChatBot.elements.toggleBtn.classList.remove('active');
}

/**
 * Add welcome message to chat
 */
function addWelcomeMessage() {
    const welcomeMessage = 'Hello! 👋 I\'m your Study Pro Global assistant. How can I help you today with your international education journey?';
    const messageElement = createMessageElement(welcomeMessage, 'assistant');
    ChatBot.elements.messagesContainer.appendChild(messageElement);
}

// =============================================================================
// MESSAGE HANDLING
// =============================================================================

/**
 * Handle sending a message
 */
async function handleSendMessage() {
    const input = ChatBot.elements.inputField;
    const rawMessage = input.value;
    
    // Sanitize input to prevent XSS
    const message = sanitizeInput(rawMessage);
    
    if (!message || ChatBot.isLoading) {
        return;
    }
    
    // Clear input
    input.value = '';
    
    // Add user message to UI (safely)
    addUserMessage(message);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to API
    await sendMessageToAPI(message);
}

/**
 * Add user message to the chat (secure)
 * @param {string} message - The message to add
 */
function addUserMessage(message) {
    // SECURE: Create element using textContent (not innerHTML)
    const messageElement = createMessageElement(message, 'user');
    ChatBot.elements.messagesContainer.appendChild(messageElement);
    scrollToBottom();
    
    // Store in messages array
    ChatBot.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });
}

/**
 * Add assistant message to the chat (secure)
 * @param {string} message - The message to add
 */
function addAssistantMessage(message) {
    // Remove typing indicator
    hideTypingIndicator();
    
    // SECURE: Sanitize bot response before display
    const sanitizedMessage = sanitizeInput(message);
    
    // SECURE: Create element using textContent (not innerHTML)
    const messageElement = createMessageElement(sanitizedMessage, 'assistant');
    ChatBot.elements.messagesContainer.appendChild(messageElement);
    scrollToBottom();
    
    // Store in messages array
    ChatBot.messages.push({
        role: 'assistant',
        content: sanitizedMessage,
        timestamp: new Date()
    });
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    ChatBot.isLoading = true;
    const indicator = createTypingIndicator();
    ChatBot.elements.messagesContainer.appendChild(indicator);
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    ChatBot.isLoading = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Scroll messages container to bottom
 */
function scrollToBottom() {
    ChatBot.elements.messagesContainer.scrollTop = ChatBot.elements.messagesContainer.scrollHeight;
}

/**
 * Add error message to chat
 * @param {string} message - The error message
 */
function addErrorMessage(message) {
    hideTypingIndicator();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chat-message error-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    // SECURE: Use textContent for error messages too
    contentDiv.textContent = message;
    
    errorDiv.appendChild(contentDiv);
    ChatBot.elements.messagesContainer.appendChild(errorDiv);
    scrollToBottom();
}

// =============================================================================
// API COMMUNICATION
// =============================================================================

/**
 * Get authentication token from storage
 * @returns {string|null} - The auth token or null
 */
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

/**
 * Send message to the chat API
 * @param {string} message - The message to send
 */
async function sendMessageToAPI(message) {
    const token = getAuthToken();
    
    if (!token) {
        // User not logged in, show login prompt
        addAssistantMessage('Please log in to use the chat feature. You can register for free to get started!');
        return;
    }
    
    try {
        const response = await fetch(`${ChatBot.apiBaseUrl}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: message,
                conversationId: ChatBot.conversationId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update conversation ID
            ChatBot.conversationId = data.data.conversationId;
            
            // Add bot response (will be sanitized in addAssistantMessage)
            addAssistantMessage(data.data.response);
        } else {
            // Handle API error
            const errorMessage = data.error?.message || 'Sorry, I encountered an error. Please try again.';
            addErrorMessage(errorMessage);
        }
    } catch (error) {
        console.error('Chat API error:', error);
        addErrorMessage('Sorry, I\'m having trouble connecting. Please check your internet connection and try again.');
    }
}

/**
 * Load conversation history
 * @param {string} conversationId - The conversation ID to load
 */
async function loadConversationHistory(conversationId) {
    const token = getAuthToken();
    
    if (!token || !conversationId) {
        return;
    }
    
    try {
        const response = await fetch(`${ChatBot.apiBaseUrl}/conversations/${conversationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.messages) {
            // Clear current messages
            ChatBot.elements.messagesContainer.innerHTML = '';
            ChatBot.messages = [];
            
            // Add each message (safely)
            data.data.messages.forEach(msg => {
                if (msg.role === 'user') {
                    addUserMessage(msg.message);
                } else {
                    addAssistantMessage(msg.message);
                }
            });
            
            ChatBot.conversationId = conversationId;
        }
    } catch (error) {
        console.error('Error loading conversation history:', error);
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatBot);
} else {
    initChatBot();
}

// Export for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChatBot,
        escapeHtml,
        sanitizeInput,
        initChatBot
    };
}
