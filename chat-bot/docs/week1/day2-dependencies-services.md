# Day 2: Dependencies & Services Setup

## 🎯 Mục tiêu ngày 2
Cài đặt và cấu hình tất cả dependencies và services cần thiết: Ollama AI models, MySQL, Redis, và thiết lập docker-compose.

## 📋 Prerequisites
- Đã hoàn thành Day 1: Environment setup
- Docker và Docker Compose đã cài đặt
- Ollama đã cài đặt và running
- Internet connection tốt cho download models và images

## 🛠️ Tasks chi tiết

### 1. Pull AI Models với Ollama
```bash
# Pull Llama2 7B model (recommended for starting)
ollama pull llama2:7b

# Alternative: Pull Mistral 7B model
ollama pull mistral:7b

# Verify models downloaded
ollama list

# Test model functionality
ollama run llama2:7b "Hello, how are you?"
```

### 2. Cài đặt MySQL với Docker
```bash
# Create directory for database data
mkdir -p data/mysql

# Run MySQL container
docker run -d \
  --name chatbot-mysql \
  -e MYSQL_DATABASE=chatbot_db \
  -e MYSQL_USER=chatbot_user \
  -e MYSQL_PASSWORD=secure_password \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -p 3306:3306 \
  -v $(pwd)/data/mysql:/var/lib/mysql \
  mysql:8.0 \
  --default-authentication-plugin=mysql_native_password

# Verify MySQL running
docker ps | grep mysql
```

### 3. Cài đặt Redis với Docker
```bash
# Create directory for Redis data
mkdir -p data/redis

# Run Redis container
docker run -d \
  --name chatbot-redis \
  -p 6379:6379 \
  -v $(pwd)/data/redis:/data \
  redis:6-alpine \
  redis-server --requirepass redis_password

# Verify Redis running
docker ps | grep redis
```

### 4. Kiểm tra kết nối giữa các services
```bash
# Test MySQL connection
docker exec -it chatbot-mysql mysql -u chatbot_user -psecure_password -e "SELECT 1;"

# Test Redis connection
docker exec -it chatbot-redis redis-cli -a redis_password ping

# Test Ollama connection
curl http://localhost:11434/api/tags
```

### 5. Tạo docker-compose.yml cho local development
```yaml
# chat-bot/docker-compose.yml
version: '3.8'

services:
  database:
    image: mysql:8.0
    container_name: chatbot-mysql
    environment:
      MYSQL_DATABASE: chatbot_db
      MYSQL_USER: chatbot_user
      MYSQL_PASSWORD: secure_password
      MYSQL_ROOT_PASSWORD: root_password
    ports:
      - "3306:3306"
    volumes:
      - ./data/mysql:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "chatbot_user", "-psecure_password"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:6-alpine
    container_name: chatbot-redis
    command: redis-server --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    container_name: chatbot-ollama
    ports:
      - "11434:11434"
    volumes:
      - ./data/ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  mysql_data:
  redis_data:
  ollama_data:
```

### 6. Khởi động services với docker-compose
```bash
# Start all services
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 7. Tạo environment configuration file
```bash
# chat-bot/.env
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chatbot_db
DB_USER=chatbot_user
DB_PASSWORD=secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2:7b

# Service Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
EOF

# Make sure to add .env to .gitignore
echo ".env" >> .gitignore
```

### 8. Verify complete setup
```bash
# Test script for complete setup verification
cat > verify-setup.sh << 'EOF'
#!/bin/bash
echo "=== Complete Setup Verification ==="

# Check MySQL
echo "MySQL:"
docker-compose exec database mysql -u chatbot_user -psecure_password -e "SELECT version();"

# Check Redis
echo "Redis:"
docker-compose exec redis redis-cli -a redis_password ping

# Check Ollama
echo "Ollama:"
curl -s http://localhost:11434/api/tags | jq .

echo "=== Verification Completed ==="
EOF

chmod +x verify-setup.sh
./verify-setup.sh
```

## ✅ Success Criteria
- [ ] Ollama models downloaded và verified
- [ ] MySQL container running và accessible
- [ ] Redis container running và accessible
- [ ] docker-compose.yml created và working
- [ ] Environment variables configured
- [ ] All services can communicate với nhau

## 🚨 Troubleshooting Common Issues

### Ollama Model Download Issues
```bash
# Check download progress
ollama ps

# Restart Ollama service
sudo systemctl restart ollama

# Manual download với curl
curl -X POST http://localhost:11434/api/pull -d '{"name": "llama2:7b"}'
```

### Docker Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :3306
sudo netstat -tulpn | grep :6379
sudo netstat -tulpn | grep :11434

# Stop conflicting services
sudo service mysql stop  # If default MySQL running
```

### Memory Issues với AI Models
```bash
# Monitor memory usage
free -h

# Use smaller model if memory constrained
ollama pull llama2:7b-chat  # Smaller variant
```

## 📊 Time Estimation
| Task | Estimated Time |
|------|----------------|
| Pull AI Models | 30-60 phút (tùy internet) |
| MySQL Setup | 15 phút |
| Redis Setup | 10 phút |
| Connection Testing | 10 phút |
| docker-compose.yml | 20 phút |
| Environment Config | 10 phút |
| Verification | 10 phút |
| **Total** | **115-145 phút** |

## 🎯 Next Steps
Sau khi hoàn thành Day 2, chuẩn bị cho Day 3:
- [ ] Verify all services running với `docker-compose ps`
- [ ] Test connections với verification script
- [ ] Ensure .env file được bảo mật (not committed to git)
- [ ] Document any issues encountered để fix later