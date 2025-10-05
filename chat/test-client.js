const io = require("socket.io-client");

const TOKEN =
  "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiRE9DVE9SIiwiaWQiOiI0MjEzOGExMi1iMTNhLTRjYjItODgwYy05MDExYjUyODRiMGEiLCJhdXRob3JpdGllcyI6W3siYXV0aG9yaXR5IjoiUk9MRV9ET0NUT1IifV0sInN1YiI6ImRvY3RvcjIyMTIiLCJpYXQiOjE3NTk2NzkzNTAsImV4cCI6MTc1OTc2NTc1MH0.qkDSuYjqOz5SsXgVVtjAtVf8p2a8bO0mCMo6IcEWXDVBitI4XBfmTjVuFWmQAV7G"; // JWT token của bác sĩ

const socket = io("http://localhost:8080/", {
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
  console.log("Connected to Chat Service!");
  console.log("Socket ID:", socket.id);

  // Gửi tin nhắn sau khi kết nối, thêm một chút độ trễ để đảm bảo xác thực hoàn tất
  setTimeout(() => {
    socket.emit("sendMessage", {
      conversationId: "f0251011-4287-4b8e-a97a-92409e22e65d", // Thay thế bằng conversationId hợp lệ
      recipientId: "b18841bc-c8d6-464d-9e35-d54f8f6b9024", // Thay thế bằng recipientId hợp lệ
      content: "Hello from Node.js client!",
      contentType: "text",
    });
  }, 1000); // 1 giây độ trễ
});

socket.on("receiveMessage", (message) => {
  console.log("Received message:", message);
});

socket.on("messageSent", (data) => {
  console.log("Message sent confirmation:", data);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("Connection Error:", err.message);
});

socket.on("error", (err) => {
  console.error("Socket Error:", err.message);
});
