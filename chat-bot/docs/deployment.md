# Hướng dẫn Triển khai Chatbot Service

## 1. Yêu cầu Hệ thống

Trước khi triển khai Chatbot Service, cần đảm bảo hệ thống đáp ứng các yêu cầu sau:

### 1.1. Yêu cầu Phần cứng
- CPU: Tối thiểu 2 nhân, khuyến nghị 4 nhân
- RAM: Tối thiểu 8GB, khuyến nghị 16GB
- Ổ đĩa: Tối thiểu 20GB dung lượng trống

### 1.2. Yêu cầu Phần mềm
- Docker Engine 20.10 trở lên
- Docker Compose 1.29 trở lên
- Git
- Node.js 16.x trở lên (nếu phát triển local)
- Python 3.8 trở lên (nếu phát triển local)

### 1.3. Các Dịch vụ Bên ngoài
- Tài khoản Ollama để chạy mô hình AI
- Tài khoản n8n để tự động hóa workflow
- Tài khoản Cloudflare/ngrok nếu cần public URL

## 2. Cấu trúc Thư mục

```
chat-bot/
├── docker-compose.yml
├── .env
├── src/
│   ├── index.js
│   ├── chatbot-service/
│   ├── rule-engine/
│   ├── rag-system/
│   └── utils/
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── components.md
│   ├── workflow.md
│   ├── deployment.md
│   ├── features.md
│   └── roadmap.md
└── tests/
```

## 3. Cấu hình Môi trường

### 3.1. File .env

Tạo file `.env` trong thư mục chat-bot với các biến môi trường sau:

```env
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatbot_db
DB_USER=chatbot_user
DB_PASSWORD=secure_password

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Ollama configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2:7b

# n8n configuration
N8N_HOST=http://localhost:5678
N8N_API_KEY=your_n8n_api_key

# API Gateway
API_GATEWAY_URL=http://api-gateway:3000

# Security
JWT_SECRET=your_jwt_secret
```

### 3.2. Cấu hình Docker

File `docker-compose.yml` mẫu:

```yaml
version: '3.8'

services:
  chatbot-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=database
      - REDIS_HOST=redis
      - OLLAMA_HOST=ollama
      - N8N_HOST=n8n
    depends_on:
      - database
      - redis
      - ollama
    volumes:
      - ./logs:/app/logs

  database:
    image: postgres:13
    environment:
      - POSTGRES_DB=chatbot_db
      - POSTGRES_USER=chatbot_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass redis_password
    ports:
      - "6379:6379"

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  db_data:
  ollama_data:
  n8n_data:
```

## 4. Triển khai Bằng Docker

### 4.1. Build Docker Image

```bash
# Di chuyển đến thư mục chat-bot
cd chat-bot

# Build Docker image
docker build -t chatbot-service .
```

### 4.2. Chạy Dịch vụ bằng Docker Compose

```bash
# Chạy tất cả các dịch vụ
docker-compose up -d

# Kiểm tra trạng thái các dịch vụ
docker-compose ps

# Xem log của chatbot-service
docker-compose logs -f chatbot-service
```

### 4.3. Dừng Dịch vụ

```bash
# Dừng tất cả các dịch vụ
docker-compose down

# Dừng và xóa volumes
docker-compose down -v
```

## 5. Triển khai Local (Phát triển)

### 5.1. Cài đặt Dependencies

```bash
# Di chuyển đến thư mục chat-bot
cd chat-bot

# Cài đặt dependencies
npm install
```

### 5.2. Chạy Ứng dụng

```bash
# Chạy ứng dụng trong môi trường phát triển
npm run dev

# Chạy ứng dụng trong môi trường production
npm start
```

### 5.3. Chạy Các Dịch vụ Phụ trợ

```bash
# Chạy database (PostgreSQL)
docker run -d --name chatbot-db -p 5432:5432 -e POSTGRES_DB=chatbot_db -e POSTGRES_USER=chatbot_user -e POSTGRES_PASSWORD=secure_password postgres:13

# Chạy Redis
docker run -d --name chatbot-redis -p 6379:6379 redis:6-alpine redis-server --requirepass redis_password

# Chạy Ollama
docker run -d --name chatbot-ollama -p 11434:11434 ollama/ollama:latest

# Chạy n8n
docker run -d --name chatbot-n8n -p 5678:5678 -e N8N_BASIC_AUTH_ACTIVE=true -e N8N_BASIC_AUTH_USER=admin -e N8N_BASIC_AUTH_PASSWORD=admin n8nio/n8n:latest
```

## 6. Cấu hình Ollama

### 6.1. Pull Mô hình

```bash
# Pull mô hình Llama2 7B
curl -X POST http://localhost:11434/api/pull -d '{"name": "llama2:7b"}'

# Pull mô hình Mistral 7B
curl -X POST http://localhost:11434/api/pull -d '{"name": "mistral:7b"}'
```

### 6.2. Kiểm tra Mô hình

```bash
# Liệt kê các mô hình đã cài đặt
curl http://localhost:11434/api/tags

# Kiểm tra mô hình đang chạy
curl http://localhost:11434/api/generate -d '{"model": "llama2:7b", "prompt": "Hello"}'
```

## 7. Cấu hình n8n

### 7.1. Truy cập n8n Dashboard

Mở trình duyệt và truy cập `http://localhost:5678`

### 7.2. Đăng nhập

- Username: admin
- Password: admin

### 7.3. Cấu hình Workflow

1. Tạo workflow mới
2. Thêm trigger webhook
3. Thêm action gửi SMS/email
4. Cấu hình credentials cho các dịch vụ bên ngoài

## 8. Cấu hình Rule Engine

### 8.1. Định nghĩa Tập luật

Tạo file `rules.json` trong thư mục `src/rule-engine/`:

```json
{
  "rules": [
    {
      "id": "rule_001",
      "condition": "contains('triệu chứng đau ngực')",
      "response": "Đau ngực có thể là dấu hiệu của nhiều vấn đề tim mạch. Bạn nên mô tả thêm về cơn đau như: vị trí, thời gian kéo dài, mức độ đau."
    },
    {
      "id": "rule_002",
      "condition": "contains('huyết áp') and contains('cao')",
      "response": "Huyết áp cao là một yếu tố nguy cơ tim mạch. Bạn nên theo dõi huyết áp thường xuyên và tuân thủ chỉ định của bác sĩ."
    }
  ]
}
```

### 8.2. Tải Tập luật

```bash
# Tải tập luật vào Rule Engine
curl -X POST http://localhost:3001/api/rules/load -H "Content-Type: application/json" -d @rules.json
```

## 9. Cấu hình RAG System

### 9.1. Chuẩn bị Tài liệu Y tế

Đặt các tài liệu y tế vào thư mục `data/medical-docs/`

### 9.2. Vector hóa Tài liệu

```bash
# Chạy script vector hóa tài liệu
python src/rag-system/vectorize_docs.py
```

### 9.3. Kiểm tra Truy xuất

```bash
# Kiểm tra truy xuất thông tin
curl -X POST http://localhost:3001/api/rag/query -H "Content-Type: application/json" -d '{"query": "triệu chứng đau tim"}'
```

## 10. Kiểm tra Triển khai

### 10.1. Kiểm tra Health Check

```bash
# Kiểm tra health check của service
curl http://localhost:3001/health
```

### 10.2. Kiểm tra API Chat

```bash
# Gửi tin nhắn thử nghiệm
curl -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d '{"message": "Tôi bị đau ngực", "userId": "user_001"}'
```

### 10.3. Kiểm tra Logs

```bash
# Xem logs của service
tail -f logs/chatbot-service.log
```

## 11. Triển khai Production

### 11.1. Build cho Production

```bash
# Build ứng dụng cho production
npm run build
```

### 11.2. Sử dụng Process Manager

```bash
# Cài đặt PM2
npm install -g pm2

# Chạy ứng dụng với PM2
pm2 start dist/index.js --name chatbot-service

# Lưu cấu hình PM2
pm2 save
```

### 11.3. Cấu hình Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name chatbot.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 12. Monitoring và Logging

### 12.1. Cấu hình Logging

```bash
# Cấu hình log rotation
sudo nano /etc/logrotate.d/chatbot-service
```

### 12.2. Monitoring với Prometheus

```bash
# Thêm endpoint metrics
curl http://localhost:3001/metrics
```

### 12.3. Alerting

Cấu hình alerting trong Prometheus hoặc Grafana để nhận thông báo khi service gặp sự cố.

## 13. Backup và Restore

### 13.1. Backup Database

```bash
# Backup database
docker exec chatbot-db pg_dump -U chatbot_user chatbot_db > backup/chatbot_db_$(date +%Y%m%d).sql
```

### 13.2. Restore Database

```bash
# Restore database
docker exec -i chatbot-db psql -U chatbot_user chatbot_db < backup/chatbot_db_20230101.sql
```

## 14. Troubleshooting

### 14.1. Service không khởi động

- Kiểm tra logs: `docker-compose logs chatbot-service`
- Kiểm tra cấu hình: `cat .env`
- Kiểm tra dependencies: `docker-compose ps`

### 14.2. Ollama không phản hồi

- Kiểm tra container: `docker ps | grep ollama`
- Kiểm tra logs: `docker logs chatbot-ollama`
- Pull lại mô hình: `curl -X POST http://localhost:11434/api/pull -d '{"name": "llama2:7b"}'`

### 14.3. n8n không gửi thông báo

- Kiểm tra workflow trong n8n dashboard
- Kiểm tra credentials
- Kiểm tra logs: `docker logs chatbot-n8n`