const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

const activeUsers = new Map();

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      console.log('File users.json not found, creating default...');
      writeUsers([{ username: 'admin', password: 'adminpassword', role: 'admin' }]);
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data).users;
  } catch (err) {
    console.error('CRITICAL ERROR reading users file:', err);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf8');
  } catch (err) {
    console.error('CRITICAL ERROR writing users file:', err);
  }
}

async function getOllamaResponse(message) {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: [{ role: 'user', content: message }],
        stream: false
      })
    });
    const data = await response.json();
    return data.message.content;
  } catch (err) {
    console.error('Ollama API error:', err);
    return 'Xin lỗi, AI đang gặp sự cố kết nối với Ollama.';
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function getPrivateRoom(user1, user2) {
  const users = [user1, user2].sort();
  return `private_${users[0]}_${users[1]}`;
}

io.on('connection', (socket) => {
  console.log('-----------------------------------------');
  console.log('NEW CONNECTION: ', socket.id);
  console.log('-----------------------------------------');

  socket.on('signup', ({ username, password }) => {
    console.log(`[Signup Request] User: ${username}`);
    try {
      const users = readUsers();
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return socket.emit('signup error', 'Tên đăng nhập đã tồn tại.');
      }
      const newUser = { username, password, role: 'user' };
      users.push(newUser);
      writeUsers(users);
      socket.emit('signup success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    } catch (e) {
      socket.emit('signup error', 'Lỗi server khi đăng ký.');
    }
  });

  socket.on('login', ({ username, password }) => {
    console.log(`[Login Request] User: ${username}`);
    try {
      const users = readUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
        activeUsers.set(socket.id, user);
        console.log(`Login success: ${user.username} (Role: ${user.role})`);
        socket.emit('login success', { username: user.username, role: user.role });
      } else {
        socket.emit('login error', 'Sai tên đăng nhập hoặc mật khẩu.');
      }
    } catch (e) {
      socket.emit('login error', 'Lỗi server khi đăng nhập.');
    }
  });

  socket.on('search-users', (query) => {
    try {
      const users = readUsers();
      const results = users
        .filter(u => u.username.toLowerCase().includes(query.toLowerCase()))
        .map(u => u.username);
      socket.emit('search results', results);
    } catch (e) {
      console.error('Search Exception:', e);
    }
  });

  socket.on('join-private-chat', (targetUsername) => {
    const user = activeUsers.get(socket.id);
    if (!user) return socket.emit('error', 'Vui lòng đăng nhập trước.');

    const room = getPrivateRoom(user.username, targetUsername);
    socket.join(room);
    console.log(`User ${user.username} joined private room ${room}`);
  });

  socket.on('private message', ({ targetUsername, text }) => {
    const user = activeUsers.get(socket.id);
    if (!user) return socket.emit('error', 'Vui lòng đăng nhập trước.');

    const room = getPrivateRoom(user.username, targetUsername);
    const formattedMsg = {
      user: user.username,
      role: user.role,
      text: text,
      timestamp: new Date().toLocaleTimeString(),
      isPrivate: true,
      target: targetUsername
    };
    io.to(room).emit('chat message', formattedMsg);
  });

  socket.on('chat message', async (msg) => {
    const user = activeUsers.get(socket.id);
    if (!user) return socket.emit('error', 'Vui lòng đăng nhập trước.');

    const formattedMsg = {
      user: user.username,
      role: user.role,
      text: msg,
      timestamp: new Date().toLocaleTimeString(),
      isPrivate: false
    };
    io.emit('chat message', formattedMsg);

    if (msg.startsWith('/ai ')) {
      const query = msg.substring(4);
      const aiResponse = await getOllamaResponse(query);
      io.emit('chat message', {
        user: 'AI Bot',
        role: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString(),
        isPrivate: false
      });
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\x1b[32m%s\x1b[0m`, `SERVER RUNNING: http://localhost:${PORT}`);
});
