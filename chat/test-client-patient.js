const io = require("socket.io-client");

const TOKEN =
  "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiUEFUSUVOVCIsImlkIjoiYjE4ODQxYmMtYzhkNi00NjRkLTllMzUtZDU0ZjhmNmI5MDI0IiwiYXV0aG9yaXRpZXMiOlt7ImF1dGhvcml0eSI6IlJPTEVfUEFUSUVOVCJ9XSwic3ViIjoicGF0aWVudDIyMTIiLCJpYXQiOjE3NTk2NTE4ODAsImV4cCI6MTc1OTczODI4MH0.jpE9zSEKspIG6QhCXLtLYmKzdOiZN_T-OthN4fj4xhH2z2oz6DL-4my9lwQcXzi-"; // JWT token của bệnh nhân

const socket = io("http://localhost:8080", {
  // Kết nối qua API Gateway
  transports: ["websocket"],
  auth: {
    token: TOKEN,
  },
  extraHeaders: {
    Authorization: TOKEN,
  },
});

socket.on("connect", () => {
  console.log("Connected to Chat Service (Patient)!");
  console.log("Socket ID (Patient):", socket.id);

  // Gửi tin nhắn sau khi kết nối
  setTimeout(() => {
    socket.emit("sendMessage", {
      conversationId: "6aa64e6c-0ded-4f21-818a-2a52f72912bd", // Thay thế bằng conversationId hợp lệ
      recipientId: "42138a12-b13a-4cb2-880c-9011b5284b0a", // ID của bác sĩ
      content: "Chào bác sĩ, tôi có một số triệu chứng muốn hỏi. 1",
      contentType: "text",
    });
  }, 1000);
});

socket.on("receiveMessage", (message) => {
  console.log("Received message (Patient):", message);
});

socket.on("messageSent", (data) => {
  console.log("Message sent confirmation (Patient):", data);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected (Patient):", reason);
});

socket.on("connect_error", (err) => {
  console.error("Connection Error (Patient):", err.message);
});

socket.on("error", (err) => {
  console.error("Socket Error (Patient):", err.message);
});
