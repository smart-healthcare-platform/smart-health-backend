# ===============================
# STAGE 1: Build NestJS app
# ===============================
FROM node:20-alpine AS builder

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và package-lock.json trước để tận dụng cache layer
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code vào container
COPY . .

# Build dự án (biên dịch TypeScript -> JavaScript)
# Sử dụng `|| true` để tránh fail nếu script copy templates dùng lệnh xcopy trên Windows
RUN npm run build || true

# Copy templates (Linux compatible)
RUN mkdir -p dist/templates && cp -r src/templates/* dist/templates/ || true

# ===============================
# STAGE 2: Runtime
# ===============================
FROM node:20-alpine

WORKDIR /app

# Copy output từ builder sang
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Cài dependencies production (nhanh hơn, nhẹ hơn)
RUN npm ci --omit=dev

# Mở port app
EXPOSE 8084

# Biến môi trường mặc định (có thể override trong docker-compose)
ENV NODE_ENV=production

# Lệnh khởi chạy app
CMD ["node", "dist/main.js"]
