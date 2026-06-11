const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const USERS_FILE = path.join(__dirname, '..', 'chat-socket-app', 'users.json');

// Load Admin credentials from users.json
function getAdminCredentials() {
    try {
        const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const admin = data.users.find(u => u.role === 'admin');
        if (!admin) throw new Error('Admin user not found in users.json');
        return admin;
    } catch (err) {
        console.error('Error loading admin credentials:', err);
        process.exit(1);
    }
}

const adminCreds = getAdminCredentials();
const socket = io(SERVER_URL);

console.log(`🤖 AI Service starting... Connecting to ${SERVER_URL}`);

socket.on('connect', () => {
    console.log('✅ Connected to Chat Server!');

    // Log in as admin
    console.log(`Logging in as ${adminCreds.username}...`);
    socket.emit('login', {
        username: adminCreds.username,
        password: adminCreds.password
    });
});

socket.on('login success', (data) => {
    console.log(`🚀 AI Bot successfully logged in as ${data.username} (Role: ${data.role})`);
    console.log('Waiting for messages to respond to...');
});

socket.on('login error', (err) => {
    console.error('❌ Login failed:', err);
});

// Handle AI responses using Ollama
async function getOllamaResponse(text) {
    try {
        console.log(`Generating AI response for: "${text}"`);

        // Use AbortController to implement a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là Admin hệ thống chat. Hãy trả lời CỰC KỲ NGẮN GỌN, súc tích, trực tiếp vào vấn đề. LUÔN LUÔN dùng tiếng Việt.'
                    },
                    { role: 'user', content: text }
                ],
                stream: false,
                options: {
                    num_predict: 150,
                    temperature: 0.7
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.message && data.message.content) {
            return data.message.content;
        } else {
            console.error('Unexpected Ollama response structure:', data);
            throw new Error('Ollama response missing message content');
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            console.error('Ollama API Request Timed Out (30s)');
            return 'Xin lỗi, AI phản hồi quá chậm, bạn vui lòng thử lại sau giây lát.';
        }
        console.error('Ollama API Error:', err.message);
        return 'Xin lỗi, tôi đang gặp chút sự cố kỹ thuật.';
    }
}

// Listen for chat messages
socket.on('chat message', async (msgData) => {
    // msgData is { user, role, text, timestamp, isPrivate }

    // 1. Log every single message received by the bot for debugging
    console.log(`[Incoming Message] From: ${msgData.user} | Text: "${msgData.text}"`);

    // Don't respond to our own messages
    if (msgData.user === adminCreds.username) return;

    // Don't respond to private messages (this bot only handles Global Chat)
    if (msgData.isPrivate) {
        console.log(`[Skipped] Private message to/from ${msgData.user} ignored.`);
        return;
    }

    // 2. IMPROVED RESPONSE LOGIC:
    // - Always respond to questions (?)
    // - Always respond if "admin" is mentioned
    // - Higher probability (80%) for other messages to feel more "active"
    const text = msgData.text.toLowerCase();
    const shouldRespond = text.includes('admin') || text.includes('?') || Math.random() < 0.8;

    if (shouldRespond) {
        console.log(`[Action] Responding to ${msgData.user}...`);

        try {
            const aiReply = await getOllamaResponse(`Người dùng ${msgData.user} nói: "${msgData.text}". Hãy trả lời họ với tư cách là Admin.`);

            // Send message to server (server will attach admin role)
            socket.emit('chat message', aiReply);
            console.log(`[Success] AI Response sent: ${aiReply}`);
        } catch (e) {
            console.error(`[Error] Failed to send AI response:`, e);
        }
    } else {
        console.log(`[Ignored] Bot decided not to respond to this message to stay natural.`);
    }
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err);
});
