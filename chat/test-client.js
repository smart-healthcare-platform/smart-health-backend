const io = require("socket.io-client");

const TOKEN =
  "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiRE9DVE9SIiwiaWQiOiI0MjEzOGExMi1iMTNhLTRjYjItODgwYy05MDExYjUyODRiMGEiLCJhdXRob3JpdGllcyI6W3siYXV0aG9yaXR5IjoiUk9MRV9ET0NUT1IifV0sInN1YiI6ImRvY3RvcjIyMTIiLCJpYXQiOjE3NTk1OTU0NDQsImV4cCI6MTc1OTY4MTg0NH0.9pOwYfUEpU9LUam5sUZ-3wOPg-UUM9OziQaEzjWT4W3gPP-N7lDDa6P7ecBaiHWK"; // JWT token của bác sĩ

const socket = io("http://localhost:8085", {
  // Kết nối trực tiếp đến Chat Service

  transports: ["websocket"],
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
      conversationId: "8bd28914-6bcc-455e-b243-eedc536e0d80", // Thay thế bằng conversationId hợp lệ
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
