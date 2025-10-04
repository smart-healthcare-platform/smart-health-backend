const io = require("socket.io-client");

const TOKEN =
  "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiUEFUSUVOVCIsImlkIjoiYjE4ODQxYmMtYzhkNi00NjRkLTllMzUtZDU0ZjhmNmI5MDI0IiwiYXV0aG9yaXRpZXMiOlt7ImF1dGhvcml0eSI6IlJPTEVfUEFUSUVOVCJ9XSwic3ViIjoicGF0aWVudDIyMTIiLCJpYXQiOjE3NTk1OTU0NjksImV4cCI6MTc1OTY4MTg2OX0.7stj80jnvzPoBXapYiwFnZjePeD2b3R1V1PmD-H-QJl96Z2MqsRcBupvGOZmoKlm"; // JWT token của bệnh nhân

const socket = io("http://localhost:8085", { // Kết nối trực tiếp đến Chat Service
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
  socket.emit("sendMessage", {
    conversationId: "8bd28914-6bcc-455e-b243-eedc536e0d80", // Thay thế bằng conversationId hợp lệ
    recipientId: "42138a12-b13a-4cb2-880c-9011b5284b0a", // ID của bác sĩ
    content: "Chào bác sĩ, tôi có một số triệu chứng muốn hỏi.",
    contentType: "text",
  });
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