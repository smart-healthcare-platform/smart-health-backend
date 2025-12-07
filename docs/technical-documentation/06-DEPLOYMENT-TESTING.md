# TÀI LIỆU DEPLOYMENT & TESTING

## MỤC LỤC
- [1. DEPLOYMENT GUIDE](#1-deployment-guide)
- [2. DOCKER & CONTAINERIZATION](#2-docker--containerization)
- [3. ENVIRONMENT CONFIGURATION](#3-environment-configuration)
- [4. TESTING STRATEGY](#4-testing-strategy)
- [5. CI/CD PIPELINE](#5-cicd-pipeline)
- [6. MONITORING & LOGGING](#6-monitoring--logging)
- [7. TROUBLESHOOTING](#7-troubleshooting)

---

## 1. DEPLOYMENT GUIDE

### 1.1. System Requirements

#### Hardware Requirements (Minimum)
```
Development:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD

Production:
- CPU: 8+ cores
- RAM: 16+ GB
- Storage: 200+ GB SSD
- Network: 1 Gbps
```

#### Software Requirements
```
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18+ (for local development)
- Java 17+ (for Spring Boot services)
- Python 3.10+ (for AI services)
- MySQL 8.0+
- MongoDB 6.0+ (for prediction service)
- Redis 7+
- Apache Kafka 7.5+
```

### 1.2. Deployment Architectures

#### 1.2.1. Development Environment
```
┌─────────────────────────────────────┐
│      Developer Machine              │
│  ┌───────────────────────────────┐ │
│  │   Docker Compose              │ │
│  │  - All services in containers │ │
│  │  - Hot reload enabled         │ │
│  │  - Debug ports exposed        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 1.2.2. Production Environment
```
┌────────────────────────────────────────────┐
│           Load Balancer (Nginx/HAProxy)     │
└────────────────┬───────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────┐              ┌─────▼──┐
│  App   │              │  App   │
│Server 1│              │Server 2│
└───┬────┘              └────┬───┘
    │                        │
    └────────┬───────────────┘
             │
    ┌────────▼──────────┐
    │  Database Cluster │
    │  - MySQL Master   │
    │  - MySQL Replicas │
    │  - MongoDB        │
    │  - Redis Cluster  │
    └───────────────────┘
```

---

## 2. DOCKER & CONTAINERIZATION

### 2.1. Docker Compose Files

#### Development Setup
```yaml
# docker-compose.yml
version: "3.8"

services:
  # Infrastructure
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Backend Services
  auth-service:
    build:
      context: ./auth
      dockerfile: Dockerfile.dev
    ports:
      - "8081:8081"
    volumes:
      - ./auth:/app
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://host.docker.internal:3306/smart_health_auth
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - kafka
    extra_hosts:
      - "host.docker.internal:host-gateway"

  # ... other services

volumes:
  redis_data:
```

### 2.2. Dockerfile Examples

#### Dockerfile for Spring Boot (Auth Service)
```dockerfile
# Dockerfile.dev (Development)
FROM gradle:7.6-jdk17-alpine AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle build --no-daemon -x test

FROM openjdk:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]

# Dockerfile (Production)
FROM gradle:7.6-jdk17-alpine AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle build --no-daemon

FROM openjdk:17-jdk-alpine
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
```

#### Dockerfile for NestJS (Patient Service)
```dockerfile
# Dockerfile.dev (Development)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8082
CMD ["npm", "run", "start:dev"]

# Dockerfile (Production)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs:nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
EXPOSE 8082
CMD ["node", "dist/main"]
```

#### Dockerfile for FastAPI (Prediction Service)
```dockerfile
# Dockerfile.dev (Development)
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8086
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8086", "--reload"]

# Dockerfile (Production)
FROM python:3.10-slim
RUN useradd -m -u 1000 appuser
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8086
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8086", "--workers", "4"]
```

#### Dockerfile for Next.js (Web)
```dockerfile
# Dockerfile (Production)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 2.3. Multi-stage Builds Benefits

✅ **Smaller Image Size**: Remove build tools from final image
✅ **Security**: Fewer attack surfaces
✅ **Performance**: Faster deployment
✅ **Layer Caching**: Optimize build time

---

## 3. ENVIRONMENT CONFIGURATION

### 3.1. Environment Files Structure

```
project/
├── .env.example              # Template
├── .env.development          # Local development
├── .env.staging              # Staging environment
├── .env.production           # Production (not in git)
└── docker-compose.override.yml
```

### 3.2. Environment Variables by Service

#### Auth Service (.env)
```bash
# Database
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/smart_health_auth
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=secure_password
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# JWT
JWT_SECRET=your-256-bit-secret-key-change-in-production
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# Server
SERVER_PORT=8081
LOGGING_LEVEL_ROOT=INFO
```

#### Patient/Doctor Services (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secure_password
DB_NAME=smart_health_patient

# Application
PORT=8082
NODE_ENV=production

# Kafka
KAFKA_BROKER=localhost:9092

# Security
JWT_SECRET=your-secret-key
GATEWAY_SECRET=your-gateway-secret
```

#### API Gateway (.env)
```bash
PORT=8080
NODE_ENV=production

# JWT
JWT_SECRET=your-secret-key
JWT_ISSUER=smart-health-gateway

# Service URLs
AUTH_SERVICE_URL=http://auth-service:8081
PATIENT_SERVICE_URL=http://patient-service:8082
DOCTOR_SERVICE_URL=http://doctor-service:8083
APPOINTMENT_SERVICE_URL=http://appointment-service:8084
CHAT_SERVICE_URL=http://chat-service:8085
NOTIFICATION_SERVICE_URL=http://notification-service:8088
MEDICINE_SERVICE_URL=http://medicine-service:8089
BILLING_SERVICE_URL=http://billing-service:8090

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
GATEWAY_SECRET=your-gateway-secret
CORS_ORIGIN=https://app.smarthealth.com,https://admin.smarthealth.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Billing Service (.env)
```bash
# MoMo Configuration
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_API_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=https://api.smarthealth.com/api/v1/billings/return
MOMO_IPN_URL=https://api.smarthealth.com/api/v1/billings/ipn/momo

# VNPay Configuration
VNPAY_TMN_CODE=LKDRSYC0
VNPAY_SECRET_KEY=VLCQ2YMCLUOIQCNOR2YB57J13I9NSWBQ
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

#### Frontend (.env)
```bash
# API
NEXT_PUBLIC_API_URL=https://api.smarthealth.com
NEXT_PUBLIC_CHAT_SERVICE_URL=https://chat.smarthealth.com

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 3.3. Secret Management

#### Development
- Use `.env` files
- Never commit to git
- Use `.env.example` as template

#### Production
- **Docker Secrets**: For Docker Swarm
- **Kubernetes Secrets**: For K8s deployments
- **AWS Secrets Manager**: For AWS
- **Azure Key Vault**: For Azure
- **HashiCorp Vault**: Enterprise solution

Example with Docker Secrets:
```yaml
services:
  auth-service:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

---

## 4. TESTING STRATEGY

### 4.1. Testing Pyramid

```
       ┌─────────────┐
       │   E2E (5%)  │
       └─────────────┘
     ┌─────────────────┐
     │Integration (15%)│
     └─────────────────┘
   ┌─────────────────────┐
   │  Unit Tests (80%)   │
   └─────────────────────┘
```

### 4.2. Unit Testing

#### Spring Boot (JUnit 5)
```java
// AuthServiceTest.java
@SpringBootTest
@AutoConfigureMockMvc
class AuthServiceTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserRepository userRepository;
    
    @Test
    void shouldRegisterNewUser() throws Exception {
        RegisterDto dto = new RegisterDto(
            "testuser", "test@example.com", "Password123!", "PATIENT"
        );
        
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("success"));
    }
    
    @Test
    void shouldRejectDuplicateUsername() throws Exception {
        when(userRepository.existsByUsername("testuser"))
            .thenReturn(true);
        
        RegisterDto dto = new RegisterDto(
            "testuser", "test@example.com", "Password123!", "PATIENT"
        );
        
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isConflict());
    }
}
```

#### NestJS (Jest)
```typescript
// patient.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './patient.entity';

describe('PatientService', () => {
  let service: PatientService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    repository = module.get(getRepositoryToken(Patient));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of patients', async () => {
      const patients = [{ id: '1', fullName: 'John Doe' }];
      repository.find.mockResolvedValue(patients);

      const result = await service.findAll({});
      expect(result).toEqual(patients);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const dto = { fullName: 'John Doe', email: 'john@example.com' };
      const patient = { id: '1', ...dto };
      
      repository.create.mockReturnValue(patient);
      repository.save.mockResolvedValue(patient);

      const result = await service.create(dto);
      expect(result).toEqual(patient);
    });
  });
});
```

#### FastAPI (Pytest)
```python
# test_prediction.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_predict_heart_disease():
    payload = {
        "patientId": "patient-001",
        "features": {
            "age": 55,
            "sex": 1,
            "chestPainType": 2,
            "restingBloodPressure": 130,
            "cholesterol": 250,
            "fastingBloodSugar": 1,
            "restingECG": 0,
            "maxHeartRate": 150,
            "exerciseInducedAngina": 0,
            "oldpeak": 2.5,
            "slope": 1,
            "numMajorVessels": 0,
            "thalassemia": 2
        }
    }
    
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "riskLevel" in data
    assert 0 <= data["prediction"] <= 1

def test_invalid_features():
    payload = {
        "patientId": "patient-001",
        "features": {"age": -1}  # Invalid age
    }
    
    response = client.post("/predict", json=payload)
    assert response.status_code == 422  # Validation error
```

#### React/Next.js (Jest + React Testing Library)
```typescript
// AppointmentCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentCard } from './AppointmentCard';

describe('AppointmentCard', () => {
  const mockAppointment = {
    id: '1',
    doctorName: 'Dr. Smith',
    date: '2024-01-15',
    startTime: '09:00',
    status: 'CONFIRMED',
    reason: 'Checkup',
  };

  it('renders appointment information', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    render(<AppointmentCard appointment={mockAppointment} onPress={onPress} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('displays status badge', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });
});
```

### 4.3. Integration Testing

#### API Integration Test
```typescript
// appointment.integration.spec.ts
describe('Appointment API Integration', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'Password123!' });
    
    authToken = loginResponse.body.data.accessToken;
  });

  it('should create appointment', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: 'patient-001',
        doctorId: 'doctor-001',
        appointmentDate: '2024-01-15',
        startTime: '09:00',
        endTime: '09:30',
        reason: 'Checkup',
      })
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 4.4. End-to-End Testing

#### Cypress (Web)
```typescript
// appointment-booking.cy.ts
describe('Appointment Booking Flow', () => {
  beforeEach(() => {
    cy.login('patient@example.com', 'Password123!');
  });

  it('should book appointment successfully', () => {
    // Navigate to doctors page
    cy.visit('/doctors');
    
    // Search for doctor
    cy.get('[data-testid="search-input"]').type('Cardiology');
    cy.get('[data-testid="search-button"]').click();
    
    // Select doctor
    cy.contains('Dr. Sarah Smith').click();
    
    // View available slots
    cy.get('[data-testid="view-slots-button"]').click();
    
    // Select date
    cy.get('[data-testid="date-picker"]').click();
    cy.contains('15').click();
    
    // Select time slot
    cy.contains('09:00 AM').click();
    
    // Fill reason
    cy.get('[data-testid="reason-input"]').type('Annual checkup');
    
    // Submit
    cy.get('[data-testid="submit-button"]').click();
    
    // Verify success
    cy.contains('Appointment booked successfully').should('be.visible');
    cy.url().should('include', '/appointments');
  });
});
```

### 4.5. Load Testing

#### Apache JMeter
```xml
<!-- appointment-load-test.jmx -->
<jmeterTestPlan>
  <ThreadGroup>
    <stringProp name="ThreadGroup.num_threads">100</stringProp>
    <stringProp name="ThreadGroup.ramp_time">10</stringProp>
    <stringProp name="ThreadGroup.duration">60</stringProp>
  </ThreadGroup>
  
  <HTTPSamplerProxy>
    <stringProp name="HTTPSampler.domain">localhost</stringProp>
    <stringProp name="HTTPSampler.port">8080</stringProp>
    <stringProp name="HTTPSampler.path">/api/appointments</stringProp>
    <stringProp name="HTTPSampler.method">GET</stringProp>
  </HTTPSamplerProxy>
</jmeterTestPlan>
```

#### k6 (Alternative)
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const response = http.get('http://localhost:8080/api/appointments');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### 4.6. Test Coverage

#### Target Coverage
- **Unit Tests**: > 80%
- **Integration Tests**: > 60%
- **E2E Tests**: Critical paths

#### Generate Coverage Report
```bash
# NestJS/Jest
npm run test:cov

# Spring Boot
./gradlew test jacocoTestReport

# Python/Pytest
pytest --cov=src --cov-report=html
```

---

## 5. CI/CD PIPELINE

### 5.1. GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Backend Services
  test-auth-service:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: smart_health_auth_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Run tests
        run: |
          cd auth
          ./gradlew test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-patient-service:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: smart_health_patient_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd patient
          npm ci
      
      - name: Run tests
        run: |
          cd patient
          npm run test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  # Frontend
  test-web-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd smart-health-website
          npm ci
      
      - name: Run tests
        run: |
          cd smart-health-website
          npm run test
      
      - name: Build
        run: |
          cd smart-health-website
          npm run build

  # Docker Build
  build-and-push:
    needs: [test-auth-service, test-patient-service, test-web-app]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push Auth Service
        uses: docker/build-push-action@v4
        with:
          context: ./auth
          push: true
          tags: smarthealth/auth-service:latest
      
      - name: Build and push Patient Service
        uses: docker/build-push-action@v4
        with:
          context: ./patient
          push: true
          tags: smarthealth/patient-service:latest

  # Deploy to Production
  deploy:
    needs: [build-and-push]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/smart-health
            docker-compose pull
            docker-compose up -d
            docker system prune -af
```

### 5.2. GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

test:auth-service:
  stage: test
  image: gradle:7.6-jdk17
  services:
    - mysql:8.0
  variables:
    MYSQL_ROOT_PASSWORD: test
    MYSQL_DATABASE: smart_health_auth_test
  script:
    - cd auth
    - gradle test

build:auth-service:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t registry.gitlab.com/smarthealth/auth-service:$CI_COMMIT_SHA ./auth
    - docker push registry.gitlab.com/smarthealth/auth-service:$CI_COMMIT_SHA
  only:
    - main

deploy:production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
  script:
    - ssh $SERVER_USER@$SERVER_HOST "cd /opt/smart-health && docker-compose pull && docker-compose up -d"
  only:
    - main
  when: manual
```

---

## 6. MONITORING & LOGGING

### 6.1. Application Logging

#### Winston (Node.js)
```typescript
// logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

export default logger;
```

### 6.2. Health Checks

#### Spring Boot Actuator
```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized
```

#### NestJS Health Check
```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private kafka: KafkaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.kafka.isHealthy('kafka'),
    ]);
  }
}
```

### 6.3. Metrics Collection

#### Prometheus Metrics
```typescript
// metrics.ts
import { register, Counter, Histogram } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route.path, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, req.route.path, res.statusCode).inc();
  });
  
  next();
});
```

### 6.4. ELK Stack (Future)

```yaml
# docker-compose-monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - elasticsearch
```

---

## 7. TROUBLESHOOTING

### 7.1. Common Issues

#### Issue: Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check if port is already in use
netstat -ano | findstr :8080

# Restart service
docker-compose restart service-name

# Rebuild and restart
docker-compose up -d --build service-name
```

#### Issue: Database Connection Failed
```bash
# Check MySQL is running
docker ps | grep mysql

# Check connection from container
docker exec -it container-name mysql -u root -p

# Check database exists
SHOW DATABASES;

# Check user privileges
SHOW GRANTS FOR 'root'@'%';
```

#### Issue: Kafka Connection Failed
```bash
# Check Kafka is running
docker-compose logs kafka

# List topics
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Check consumer groups
docker exec kafka kafka-consumer-groups --list --bootstrap-server localhost:9092
```

### 7.2. Performance Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Limit memory in docker-compose.yml
services:
  auth-service:
    mem_limit: 512m
    memswap_limit: 512m
```

#### Slow Database Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow queries
SELECT * FROM mysql.slow_log;

-- Add indexes
CREATE INDEX idx_appointment_date ON appointments(appointment_date);
```

### 7.3. Debugging

#### Remote Debugging (Spring Boot)
```yaml
# docker-compose.yml
services:
  auth-service:
    environment:
      JAVA_OPTS: "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
    ports:
      - "5005:5005"
```

#### Remote Debugging (Node.js)
```yaml
services:
  patient-service:
    command: node --inspect=0.0.0.0:9229 dist/main
    ports:
      - "9229:9229"
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Backup current production data
- [ ] Update documentation
- [ ] Security scan passed

### Deployment
- [ ] Build Docker images
- [ ] Push to registry
- [ ] Pull images on server
- [ ] Run database migrations
- [ ] Start services with docker-compose
- [ ] Health check all services
- [ ] Smoke test critical features

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Check metrics dashboards
- [ ] Verify all integrations working
- [ ] Test payment gateways
- [ ] Notify team of deployment
- [ ] Update release notes

---

**Phiên bản**: 1.0.0  
**Ngày cập nhật**: 2024  
**Tác giả**: Smart Health DevOps Team