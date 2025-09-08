# Day 1: Environment Setup & Development Foundation

## 🎯 Mục tiêu ngày 1
Thiết lập hoàn chỉnh môi trường phát triển local với tất cả tools và dependencies cần thiết cho Chatbot Service.

## 📋 Prerequisites
- Hệ điều hành: Ubuntu 20.04+ / macOS / Windows với WSL2
- RAM tối thiểu: 8GB (khuyến nghị 16GB cho AI models)
- Disk space: 20GB trống
- Internet connection stable

## 🛠️ Tasks chi tiết

### 1. Cài đặt Node.js và npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS với Homebrew
brew install node@18

# Verify installation
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 2. Cài đặt Python 3.8+
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.8 python3-pip python3-venv

# macOS
brew install python@3.8

# Verify installation
python3 --version  # Python 3.8.x
pip3 --version
```

### 3. Cài đặt Docker và Docker Compose
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# macOS (Docker Desktop)
# Download từ https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Cài đặt Git và cấu hình repository
```bash
# Install Git
sudo apt install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main

# Clone repository (nếu có)
git clone <repository-url>
cd smart-health-backend/chat-bot
```

### 5. Thiết lập IDE/Editor
**Visual Studio Code Extensions:**
- [ ] Docker
- [ ] Python
- [ ] JavaScript/TypeScript
- [ ] REST Client
- [ ] GitLens
- [ ] Prettier - Code formatter

**Recommended Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "files.autoSave": "onFocusChange"
}
```

### 6. Cài đặt Ollama
```bash
# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# macOS
brew install ollama

# Start Ollama service
ollama serve

# Verify installation
ollama --version
```

### 7. Cài đặt additional tools
```bash
# curl for API testing
sudo apt install curl

# jq for JSON processing
sudo apt install jq

# Postman (optional)
# Download từ https://www.postman.com/downloads/
```

### 8. Verify Development Environment
```bash
# Create test script
cat > test-environment.sh << 'EOF'
#!/bin/bash
echo "=== Environment Test ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Python: $(python3 --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "Git: $(git --version)"
echo "Ollama: $(ollama --version)"
echo "=== Test Completed ==="
EOF

chmod +x test-environment.sh
./test-environment.sh
```

## ✅ Success Criteria
- [ ] Tất cả commands chạy thành công không lỗi
- [ ] Các version numbers hiển thị correctly
- [ ] Docker có thể run containers
- [ ] Ollama service khởi động được
- [ ] Git configured properly

## 🚨 Troubleshooting Common Issues

### Docker Permission Issues (Linux)
```bash
# Fix docker permissions
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

### Ollama Connection Issues
```bash
# Check Ollama status
systemctl status ollama

# Restart Ollama
sudo systemctl restart ollama

# Check logs
journalctl -u ollama -f
```

### Node.js Version Issues
```bash
# Use nvm for node version management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## 📊 Time Estimation
| Task | Estimated Time |
|------|----------------|
| Node.js & npm | 15 phút |
| Python 3.8+ | 10 phút |
| Docker & Compose | 20 phút |
| Git Setup | 5 phút |
| IDE Setup | 15 phút |
| Ollama Install | 10 phút |
| Verification | 5 phút |
| **Total** | **80 phút** |

## 🎯 Next Steps
Sau khi hoàn thành Day 1, chuẩn bị cho Day 2:
- [ ] Đảm bảo internet connection stable cho download models
- [ ] Chuẩn bị ít nhất 10GB disk space cho AI models
- [ ] Verify Docker có thể pull images từ Docker Hub