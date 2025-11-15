# Step-by-Step Implementation Guide
# Admin Dashboard API Integration into Existing Services

## 📋 Overview

This guide provides detailed steps to integrate Admin Dashboard APIs into existing microservices without creating a new service.

**Estimated Time:** 3-4 days for complete implementation

---

## 🎯 Phase 1: API Gateway Setup (Day 1)

### Step 1.1: Install Required Dependencies

```bash
cd api-gateway
npm install ioredis socket.io jsonwebtoken axios
```

### Step 1.2: Create Admin Route Structure

```bash
mkdir -p src/routes/admin
mkdir -p src/services/cache
mkdir -p src/services/aggregator
mkdir -p src/socket
```

### Step 1.3: Create Redis Service

**File:** `api-gateway/src/services/cache/redisService.js`

```javascript
const Redis = require('ioredis');
const logger = require('../../config/logger');

class RedisService {
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis GET Error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET Error', { key, error: error.message });
      return false;
    }
  }

  async del(pattern) {
    try {
      if (pattern.includes('*')) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        await this.client.del(pattern);
      }
      return true;
    } catch (error) {
      logger.error('Redis DEL Error', { pattern, error: error.message });
      return false;
    }
  }

  async exists(key) {
    return await this.client.exists(key);
  }
}

module.exports = new RedisService();
```

### Step 1.4: Create Dashboard Aggregator Service

**File:** `api-gateway/src/services/aggregator/dashboardAggregator.js`

```javascript
const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');
const redisService = require('../cache/redisService');

class DashboardAggregator {
  constructor() {
    this.CACHE_TTL = {
      STATS: 30, // 30 seconds
      TRENDS: 60, // 1 minute
      GROWTH: 3600, // 1 hour
    };
  }

  /**
   * Call internal service with authentication
   */
  async callService(serviceName, endpoint, options = {}) {
    const serviceConfig = config.services[serviceName];
    if (!serviceConfig) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    const url = `${serviceConfig.url}${endpoint}`;
    
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'X-Internal-Request': 'true',
          'X-Gateway-Secret': process.env.GATEWAY_SECRET,
          ...options.headers,
        },
        params: options.params,
        timeout: options.timeout || 5000,
      });

      return response.data;
    } catch (error) {
      logger.error('Service call failed', {
        service: serviceName,
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Aggregate dashboard statistics from all services
   */
  async getDashboardStats() {
    const cacheKey = 'admin:stats:v1';
    
    // Try cache first
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Dashboard stats cache hit');
      return cached;
    }

    logger.debug('Dashboard stats cache miss - fetching from services');

    try {
      // Call all services in parallel
      const [
        patientStats,
        doctorStats,
        appointmentStats,
        revenueStats,
        medicineStats,
      ] = await Promise.allSettled([
        this.callService('patient', '/v1/admin/patients/stats'),
        this.callService('doctor', '/v1/admin/doctors/stats'),
        this.callService('appointment', '/v1/admin/appointments/stats'),
        this.callService('billing', '/v1/admin/revenue/stats'),
        this.callService('medicine', '/v1/admin/medicine/stats'),
      ]);

      // Aggregate results
      const stats = {
        patients: this.extractData(patientStats),
        doctors: this.extractData(doctorStats),
        appointments: this.extractData(appointmentStats),
        revenue: this.extractData(revenueStats),
        medicine: this.extractData(medicineStats),
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      await redisService.set(cacheKey, stats, this.CACHE_TTL.STATS);

      return stats;
    } catch (error) {
      logger.error('Failed to aggregate dashboard stats', error);
      throw error;
    }
  }

  /**
   * Extract data from Promise.allSettled result
   */
  extractData(result) {
    if (result.status === 'fulfilled') {
      return result.value.data || result.value;
    }
    logger.warn('Service call failed', { reason: result.reason?.message });
    return null;
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const cacheKey = 'admin:system:health';
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const services = ['patient', 'doctor', 'appointment', 'billing', 'medicine'];
    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const start = Date.now();
        try {
          await this.callService(service, '/health', { timeout: 3000 });
          return {
            name: service,
            status: 'healthy',
            responseTime: Date.now() - start,
          };
        } catch (error) {
          return {
            name: service,
            status: 'unhealthy',
            responseTime: Date.now() - start,
            error: error.message,
          };
        }
      })
    );

    const health = {
      services: healthChecks.map((result) => result.value),
      timestamp: new Date().toISOString(),
    };

    await redisService.set(cacheKey, health, 5); // 5 seconds TTL
    return health;
  }
}

module.exports = new DashboardAggregator();
```

### Step 1.5: Create Admin Authentication Middleware

**File:** `api-gateway/src/middleware/adminAuth.js`

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Middleware to verify admin role
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin role
    if (!decoded.roles?.includes('ADMIN') && decoded.role !== 'ADMIN') {
      logger.warn('Unauthorized admin access attempt', {
        userId: decoded.id,
        roles: decoded.roles,
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }
    
    // Attach user to request
    req.user = decoded;
    
    logger.debug('Admin authenticated', {
      userId: decoded.id,
      email: decoded.email,
    });
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    
    logger.error('Admin auth error', error);
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

module.exports = adminAuth;
```

### Step 1.6: Create Admin Dashboard Routes

**File:** `api-gateway/src/routes/admin/dashboard.js`

```javascript
const express = require('express');
const router = express.Router();
const dashboardAggregator = require('../../services/aggregator/dashboardAggregator');
const logger = require('../../config/logger');

/**
 * GET /v1/admin/dashboard/stats
 * Get aggregated dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await dashboardAggregator.getDashboardStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get dashboard stats', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
```

**File:** `api-gateway/src/routes/admin/system.js`

```javascript
const express = require('express');
const router = express.Router();
const dashboardAggregator = require('../../services/aggregator/dashboardAggregator');
const logger = require('../../config/logger');

/**
 * GET /v1/admin/system/health
 * Get system health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await dashboardAggregator.getSystemHealth();
    
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Failed to get system health', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health',
    });
  }
});

module.exports = router;
```

**File:** `api-gateway/src/routes/admin/index.js`

```javascript
const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth');

// Import admin sub-routes
const dashboardRoutes = require('./dashboard');
const systemRoutes = require('./system');

// Apply admin authentication to all admin routes
router.use(adminAuth);

// Mount sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);

module.exports = router;
```

### Step 1.7: Update Main Routes

**File:** `api-gateway/src/routes/index.js`

Add this import and route:

```javascript
// ... existing imports ...
const adminRoutes = require('./admin');

// ... existing routes ...

/**
 * Admin routes
 */
router.use(`${API_VERSION}/admin`, adminRoutes);

// Update endpoints list
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Health API Gateway",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      auth: `${API_VERSION}/auth`,
      patients: `${API_VERSION}/patients`,
      doctors: `${API_VERSION}/doctors`,
      appointments: `${API_VERSION}/appointments`,
      notifications: `${API_VERSION}/notifications`,
      prediction: `${API_VERSION}/prediction`,
      chatbot: `${API_VERSION}/chatbot`,
      medicine: `${API_VERSION}/medicine`,
      admin: `${API_VERSION}/admin`, // NEW
    },
    documentation: "/api-docs",
  });
});
```

### Step 1.8: Update Environment Variables

**File:** `api-gateway/.env`

```env
# Existing variables...

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Admin Configuration
GATEWAY_SECRET=your-secure-gateway-secret-change-in-production

# JWT Configuration (if not exists)
JWT_SECRET=your-jwt-secret-key
```

---

## 🎯 Phase 2: Patient Service Admin Module (Day 1-2)

### Step 2.1: Create Admin Module Structure

```bash
cd patient/src/modules
mkdir -p admin/dto
```

### Step 2.2: Create DTOs

**File:** `patient/src/modules/admin/dto/patient-stats.dto.ts`

```typescript
import { IsOptional, IsDateString } from 'class-validator';

export class PatientStatsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class PatientStatsResponseDto {
  totalPatients: number;
  activePatients: number;
  newThisMonth: number;
  newThisWeek: number;
  growthRate: number;
}
```

**File:** `patient/src/modules/admin/dto/patient-growth.dto.ts`

```typescript
export class PatientGrowthDto {
  date: string;
  count: number;
  cumulative: number;
}

export class PatientGrowthResponseDto {
  period: string;
  data: PatientGrowthDto[];
  totalGrowth: number;
  averagePerDay: number;
}
```

### Step 2.3: Create Admin Service

**File:** `patient/src/modules/admin/admin.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Patient } from '../patient/entities/patient.entity';
import { PatientStatsResponseDto } from './dto/patient-stats.dto';
import { PatientGrowthResponseDto } from './dto/patient-growth.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<PatientStatsResponseDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalPatients,
      activePatients,
      newThisMonth,
      newThisWeek,
      newLastMonth,
    ] = await Promise.all([
      this.patientRepository.count(),
      this.patientRepository.count({ where: { isActive: true } }),
      this.patientRepository.count({
        where: { createdAt: MoreThan(startOfMonth) },
      }),
      this.patientRepository.count({
        where: { createdAt: MoreThan(startOfWeek) },
      }),
      this.patientRepository.count({
        where: {
          createdAt: Between(lastMonth, startOfMonth),
        },
      }),
    ]);

    const growthRate =
      newLastMonth > 0
        ? ((newThisMonth - newLastMonth) / newLastMonth) * 100
        : 0;

    return {
      totalPatients,
      activePatients,
      newThisMonth,
      newThisWeek,
      growthRate: Math.round(growthRate * 10) / 10,
    };
  }

  /**
   * Get patient growth over time
   */
  async getPatientGrowth(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30,
  ): Promise<PatientGrowthResponseDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use raw query for better performance
    const result = await this.patientRepository
      .createQueryBuilder('patient')
      .select("DATE(patient.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('patient.createdAt >= :startDate', { startDate })
      .andWhere('patient.createdAt <= :endDate', { endDate })
      .groupBy("DATE(patient.createdAt)")
      .orderBy("DATE(patient.createdAt)", 'ASC')
      .getRawMany();

    let cumulative = 0;
    const data = result.map((row) => {
      cumulative += parseInt(row.count);
      return {
        date: row.date,
        count: parseInt(row.count),
        cumulative,
      };
    });

    const totalGrowth = data[data.length - 1]?.cumulative || 0;
    const averagePerDay = totalGrowth / days;

    return {
      period,
      data,
      totalGrowth,
      averagePerDay: Math.round(averagePerDay * 10) / 10,
    };
  }

  /**
   * Get recent patients
   */
  async getRecentPatients(limit: number = 10) {
    return this.patientRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'fullName', 'email', 'phone', 'createdAt'],
    });
  }

  /**
   * Get patient demographics
   */
  async getPatientDemographics() {
    const [byGender, byAge] = await Promise.all([
      this.patientRepository
        .createQueryBuilder('patient')
        .select('patient.gender', 'gender')
        .addSelect('COUNT(*)', 'count')
        .groupBy('patient.gender')
        .getRawMany(),
      this.patientRepository
        .createQueryBuilder('patient')
        .select(
          `CASE 
            WHEN TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()) < 18 THEN '0-18'
            WHEN TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()) BETWEEN 18 AND 35 THEN '19-35'
            WHEN TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()) BETWEEN 36 AND 50 THEN '36-50'
            ELSE '51+'
          END`,
          'ageGroup',
        )
        .addSelect('COUNT(*)', 'count')
        .groupBy('ageGroup')
        .getRawMany(),
    ]);

    return {
      byGender: Object.fromEntries(
        byGender.map((g) => [g.gender, parseInt(g.count)]),
      ),
      byAge: Object.fromEntries(
        byAge.map((a) => [a.ageGroup, parseInt(a.count)]),
      ),
    };
  }
}
```

### Step 2.4: Create Admin Controller

**File:** `patient/src/modules/admin/admin.controller.ts`

```typescript
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { InternalGuard } from '../../common/guards/internal.guard';

@Controller('v1/admin/patients')
@UseGuards(InternalGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    this.logger.debug('Getting patient stats');
    const stats = await this.adminService.getPatientStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('growth')
  async getGrowth(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    this.logger.debug(`Getting patient growth: ${period}, ${days} days`);
    const growth = await this.adminService.getPatientGrowth(period, days);
    return {
      success: true,
      data: growth,
    };
  }

  @Get('recent')
  async getRecent(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    this.logger.debug(`Getting recent patients: limit ${limit}`);
    const patients = await this.adminService.getRecentPatients(limit);
    return {
      success: true,
      data: patients,
    };
  }

  @Get('demographics')
  async getDemographics() {
    this.logger.debug('Getting patient demographics');
    const demographics = await this.adminService.getPatientDemographics();
    return {
      success: true,
      data: demographics,
    };
  }
}
```

### Step 2.5: Create Internal Guard

**File:** `patient/src/common/guards/internal.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalGuard implements CanActivate {
  private readonly logger = new Logger(InternalGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isInternal = request.headers['x-internal-request'] === 'true';
    const secret = request.headers['x-gateway-secret'];
    const expectedSecret = this.configService.get<string>('GATEWAY_SECRET');

    if (!isInternal || secret !== expectedSecret) {
      this.logger.warn('Unauthorized internal request attempt', {
        ip: request.ip,
        path: request.path,
      });
      throw new UnauthorizedException('Unauthorized internal request');
    }

    return true;
  }
}
```

### Step 2.6: Create Admin Module

**File:** `patient/src/modules/admin/admin.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Patient } from '../patient/entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
```

### Step 2.7: Register Admin Module

**File:** `patient/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
// ... existing imports ...
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // ... existing modules ...
    AdminModule, // ADD THIS
  ],
  // ... rest of the module
})
export class AppModule {}
```

### Step 2.8: Update Environment Variables

**File:** `patient/.env`

```env
# Existing variables...

# Gateway Secret for internal requests
GATEWAY_SECRET=your-secure-gateway-secret-change-in-production
```

---

## 🎯 Phase 3: Appointment Service Admin Module (Day 2)

### Step 3.1: Create Module Structure

```bash
cd appointment/src/module
mkdir -p admin/dto
```

### Step 3.2: Create DTOs

**File:** `appointment/src/module/admin/dto/appointment-stats.dto.ts`

```typescript
export class AppointmentStatsResponseDto {
  totalToday: number;
  completed: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  noShow: number;
  distribution: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
}
```

### Step 3.3: Create Admin Service

**File:** `appointment/src/module/admin/admin.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Appointment } from '../appointment/entities/appointment.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async getAppointmentStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalToday,
      completed,
      pending,
      confirmed,
      cancelled,
      byStatus,
      byType,
    ] = await Promise.all([
      this.appointmentRepository.count({
        where: { appointmentDate: Between(today, tomorrow) },
      }),
      this.appointmentRepository.count({
        where: {
          appointmentDate: Between(today, tomorrow),
          status: 'completed',
        },
      }),
      this.appointmentRepository.count({
        where: { appointmentDate: Between(today, tomorrow), status: 'pending' },
      }),
      this.appointmentRepository.count({
        where: {
          appointmentDate: Between(today, tomorrow),
          status: 'confirmed',
        },
      }),
      this.appointmentRepository.count({
        where: {
          appointmentDate: Between(today, tomorrow),
          status: 'cancelled',
        },
      }),
      this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('appointment.status')
        .getRawMany(),
      this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('appointment.type')
        .getRawMany(),
    ]);

    return {
      totalToday,
      completed,
      pending,
      confirmed,
      cancelled,
      noShow: totalToday - completed - pending - confirmed - cancelled,
      distribution: {
        byStatus: Object.fromEntries(
          byStatus.map((s) => [s.status, parseInt(s.count)]),
        ),
        byType: Object.fromEntries(
          byType.map((t) => [t.type, parseInt(t.count)]),
        ),
      },
    };
  }

  async getAppointmentTrends(days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select("DATE(appointment.appointmentDate)", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('appointment.status', 'status')
      .where('appointment.appointmentDate >= :startDate', { startDate })
      .andWhere('appointment.appointmentDate <= :endDate', { endDate })
      .groupBy("DATE(appointment.appointmentDate)")
      .addGroupBy('appointment.status')
      .orderBy("DATE(appointment.appointmentDate)", 'ASC')
      .getRawMany();

    return {
      period: `${days} days`,
      data: result,
    };
  }

  async getRecentAppointments(limit: number = 10) {
    return this.appointmentRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['patient', 'doctor'],
      select: {
        id: true,
        appointmentDate: true,
        status: true,
        type: true,
        patient: { id: true, fullName: true },
        doctor: { id: true, fullName: true },
      },
    });
  }
}
```

### Step 3.4: Create Admin Controller

**File:** `appointment/src/module/admin/admin.controller.ts`

```typescript
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { InternalGuard } from '../../common/guards/internal.guard';

@Controller('v1/admin/appointments')
@UseGuards(InternalGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    this.logger.debug('Getting appointment stats');
    const stats = await this.adminService.getAppointmentStats();
    return { success: true, data: stats };
  }

  @Get('trends')
  async getTrends(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    this.logger.debug(`Getting appointment trends: ${days} days`);
    const trends = await this.adminService.getAppointmentTrends(days);
    return { success: true, data: trends };
  }

  @Get('recent')
  async getRecent(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    this.logger.debug(`Getting recent appointments: limit ${limit}`);
    const appointments = await this.adminService.getRecentAppointments(limit);
    return { success: true, data: appointments };
  }
}
```

### Step 3.5: Create Admin Module and Register

**File:** `appointment/src/module/admin/admin.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Appointment } from '../appointment/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
```

Update `appointment/src/app.module.ts` to include AdminModule.

---

## 🎯 Phase 4: Doctor & Billing Services (Day 3)

Follow similar patterns as Patient and Appointment services:

1. Create admin module structure
2. Create DTOs
3. Create service with business logic
4. Create controller with routes
5. Add InternalGuard
6. Register module

### Doctor Service Endpoints:
- `GET /v1/admin/doctors/stats`
- `GET /v1/admin/doctors/top`
- `GET /v1/admin/departments/performance`

### Billing Service Endpoints:
- `GET /v1/admin/revenue/stats`
- `GET /v1/admin/revenue/distribution`
- `GET /v1/admin/revenue/trends`

---

## 🎯 Phase 5: Testing & Integration (Day 4)

### Step 5.1: Test Individual Services

```bash
# Test Patient Service
curl -H "X-Internal-Request: true" \
     -H "X-Gateway-Secret: your-secret" \
     http://localhost:8082/v1/admin/patients/stats

# Test Appointment Service
curl -H "X-Internal-Request: true" \
     -H "X-Gateway-Secret: your-secret" \
     http://localhost:8084/v1/admin/appointments/stats
```

### Step 5.2: Test API Gateway Aggregation

```bash
# Get admin token first
TOKEN=$(curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# Test dashboard stats
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/v1/admin/dashboard/stats
```

### Step 5.3: Test Caching

```bash
# First request (cache miss)
time curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/v1/admin/dashboard/stats

# Second request (cache hit - should be faster)
time curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/v1/admin/dashboard/stats
```

### Step 5.4: Verify Redis

```bash
redis-cli
> KEYS admin:*
> GET admin:stats:v1
> TTL admin:stats:v1
```

---

## 🚀 Deployment

### Update docker-compose.yml

```yaml
services:
  # ... existing services ...

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

### Start Services

```bash
docker-compose up -d redis
docker-compose restart api-gateway
docker-compose restart patient
docker-compose restart appointment
docker-compose restart doctor
docker-compose restart billing
```

---

## ✅ Verification Checklist

- [ ] Redis is running and accessible
- [ ] All services have GATEWAY_SECRET configured
- [ ] API Gateway can call each service internally
- [ ] Admin authentication middleware works
- [ ] Cache is working (verify with Redis CLI)
- [ ] Each service returns correct data
- [ ] Dashboard aggregation works
- [ ] Response times are acceptable (<500ms for cached)
- [ ] Error handling works properly
- [ ] Logs show proper information

---

## 📚 Next Steps

1. Implement real-time updates with Socket.io
2. Add monitoring and alerting
3. Optimize database queries with indexes
4. Add unit and integration tests
5. Document all APIs with Swagger
6. Set up CI/CD pipeline
7. Performance testing

---

## 🐛 Common Issues & Solutions

### Issue 1: Service cannot connect to Redis
**Solution:** Check Redis host/port in .env file

### Issue 2: Internal guard rejects requests
**Solution:** Ensure GATEWAY_SECRET matches in all services

### Issue 3: Slow aggregation
**Solution:** Check if individual service endpoints are slow, add database indexes

### Issue 4: Cache not invalidating
**Solution:** Implement Kafka consumers for event-based invalidation

---

**Congratulations!** You now have a fully integrated Admin Dashboard API without creating a new service! 🎉