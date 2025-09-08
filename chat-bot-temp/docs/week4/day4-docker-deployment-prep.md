# Tuần 4, Ngày 4: Đóng gói và Chuẩn bị Triển khai

## 🎯 Mục tiêu

- Tối ưu hóa và hoàn thiện `Dockerfile` và `docker-compose.yml`.
- Đảm bảo toàn bộ hệ thống có thể được khởi chạy một cách dễ dàng và đáng tin cậy bằng Docker.

## 🛠️ Tasks chi tiết

### 1. Tối ưu hóa `Dockerfile`
- **File:** `Dockerfile`
- **Nhiệm vụ:**
    - **Multi-stage builds:** Sử dụng multi-stage builds để giảm kích thước của image cuối cùng.
        - Stage 1 (`builder`): Cài đặt tất cả `dependencies` (bao gồm cả `devDependencies`) và build/transpile code nếu cần.
        - Stage 2 (`production`): Chỉ cài đặt `dependencies` cho production (`npm ci --only=production`) và copy các file đã build từ stage 1.
    - **Caching:** Tối ưu hóa thứ tự các lệnh `COPY` và `RUN` để tận dụng cache của Docker. `COPY package*.json` trước, sau đó `npm ci`, rồi mới `COPY . .`.
    - **User không phải root:** Tạo và sử dụng một user không phải root để chạy ứng dụng, tăng cường bảo mật.
    - **Healthcheck:** Thêm lệnh `HEALTHCHECK` để Docker có thể tự động kiểm tra tình trạng của container.

### 2. Hoàn thiện `docker-compose.yml`
- **File:** `docker-compose.yml`
- **Nhiệm vụ:**
    - **Volumes:** Rà soát lại tất cả các volumes, đảm bảo dữ liệu quan trọng (của MySQL, ChromaDB, n8n) được lưu trữ bền vững (persistent).
    - **Networks:** Tạo một network tùy chỉnh (`custom network`) để các service giao tiếp với nhau một cách an toàn thay vì dùng network mặc định.
    - **Restart policies:** Thêm `restart: unless-stopped` cho các service quan trọng để chúng tự động khởi động lại khi gặp lỗi.
    - **Dependencies:** Sử dụng `depends_on` để định nghĩa thứ tự khởi chạy của các service (ví dụ: `chatbot-service` phụ thuộc vào `database` và `redis`).

### 3. Xây dựng và Kiểm tra Image
- **Công cụ:** Docker
- **Nhiệm vụ:**
    - Chạy `docker-compose build` để xây dựng lại image của `chatbot-service` sau khi đã tối ưu hóa.
    - Chạy `docker-compose up -d` để khởi động toàn bộ hệ thống.
    - Kiểm tra xem tất cả các container có đang chạy (`running`) và khỏe mạnh (`healthy`) không bằng lệnh `docker-compose ps`.

## ✅ Success Criteria
- [ ] `Dockerfile` được tối ưu hóa với multi-stage builds và user không phải root.
- [ ] `docker-compose.yml` được hoàn thiện với network, volumes, và restart policies.
- [ ] Toàn bộ hệ thống có thể khởi chạy thành công bằng một lệnh `docker-compose up`.
- [ ] Kích thước của image `chatbot-service` đã giảm so với trước khi tối ưu.