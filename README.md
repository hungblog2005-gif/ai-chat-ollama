# 🤖 AI Chat Multi-User (Ollama Integration)

Hệ thống chat thời gian thực hỗ trợ đa người dùng, tích hợp trí tuệ nhân tạo (AI) tự động thông qua Ollama. Dự án cho phép người dùng chat tổng, chat riêng 1-1 và tương tác với một Quản trị viên AI tự động.

## ✨ Tính năng chính

- **Chat Thời Gian Thực**: Sử dụng Socket.io để truyền tải tin nhắn tức thì.
- **Hệ Thống Tài Khoản**: Đăng ký, đăng nhập đơn giản, lưu trữ thông tin người dùng qua JSON.
- **Phân Quyền Admin**: Tài khoản quản trị viên có nhãn nhận diện riêng và quyền hạn đặc biệt.
- **Chat Riêng 1-1**: Tìm kiếm người dùng và khởi tạo cuộc trò chuyện riêng tư, bảo mật.
- **AI Bot Tự Động**: 
    - Một dịch vụ AI riêng biệt (`ai-service`) tự động đăng nhập dưới quyền Admin.
    - Tự động theo dõi Chat Tổng và phản hồi người dùng thông qua model **Llama 3** của Ollama.
    - Hỗ trợ trả lời thông minh bằng tiếng Việt.
- **Khởi Chạy Tập Trung**: Tích hợp file `start.js` để khởi động toàn bộ hệ thống chỉ với một lệnh.

## 🛠 Yêu Cầu Cài Đặt

### 1. Phần mềm cần thiết
- **Node.js** (Phiên bản mới nhất)
- **Ollama** ([Tải tại ollama.com](https://ollama.com))

### 2. Cài đặt AI Model
Trước khi chạy, bạn cần tải model `llama3` về máy bằng lệnh:
```bash
ollama pull llama3
```

## 🚀 Hướng dẫn cài đặt và vận hành

### Bước 1: Cài đặt dependencies
Di chuyển vào thư mục `chat-socket-app` và `ai-service` để cài đặt các thư viện cần thiết:

```bash
# Cài cho Server
cd chat-socket-app
npm install

# Cài cho AI Service
cd ../ai-service
npm install
cd ..
```

### Bước 2: Khởi chạy hệ thống
Bạn không cần chạy từng file lẻ. Hãy sử dụng file launcher tại thư mục gốc:

```bash
node start.js
```

### Bước 3: Truy cập ứng dụng
Mở trình duyệt và truy cập địa chỉ:
👉 **`http://localhost:3000`**

## 🔑 Thông tin quản trị
Tài khoản Admin mặc định được tạo sẵn trong `users.json`:
- **Username**: `admin`
- **Password**: `adminpassword`

## 📂 Cấu trúc thư mục

```text
D:\Chat_boxIA\
├── start.js                # File khởi chạy toàn bộ hệ thống (Server + AI Bot)
├── chat-socket-app/        # Mã nguồn Server và Giao diện người dùng
│   ├── server.js           # Xử lý Socket.io, Auth và Routing
│   ├── index.html          # Giao diện Frontend (HTML/CSS/JS)
│   └── users.json          # Lưu trữ thông tin tài khoản người dùng
└── ai-service/             # Dịch vụ AI tự động
    ├── index.js            # Logic điều khiển Bot AI kết nối với Ollama
    └── package.json        # Dependencies của AI Service
```

## ⚙️ Cơ chế hoạt động của AI Bot
Bot AI hoạt động như một "Client đặc biệt". Nó kết nối tới Chat Server, đăng nhập bằng tài khoản Admin, và lắng nghe mọi tin nhắn. Khi phát hiện câu hỏi hoặc nhắc đến "admin", nó sẽ gửi yêu cầu đến API của Ollama (`localhost:11434`) để tạo câu trả lời và gửi ngược lại vào phòng chat.

---
*Phát triển bởi Claude Code 🤖*
