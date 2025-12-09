const io = require("socket.io-client");

const TOKEN =
  "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiUEFUSUVOVCIsImlkIjoiYjE4ODQxYmMtYzhkNi00NjRkLTllMzUtZDU0ZjhmNmI5MDI0IiwiYXV0aG9yaXRpZXMiOlt7ImF1dGhvcml0eSI6IlJPTEVfUEFUSUVOVCJ9XSwic3ViIjoicGF0aWVudDIyMTIiLCJpYXQiOjE3NTk2NzY3MDEsImV4cCI6MTc1OTc2MzEwMX0.9vKKNPpNWOT-rBUf91D1D5psx9fVh6VnZwRwYhVceJON1iiuoMFJwrGCYoVzsRD_"; // JWT token của bệnh nhân

const socket = io("http://localhost:8080", {
  // Kết nối qua API Gateway
  transports: ["websocket"],
  perMessageDeflate: false, // Tắt permessage-deflate ở client
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
      conversationId: "f0251011-4287-4b8e-a97a-92409e22e65d", // Thay thế bằng conversationId hợp lệ
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
