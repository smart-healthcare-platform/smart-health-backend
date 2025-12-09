# Admin Dashboard API - Code Examples

## 📋 Table of Contents

1. [API Gateway Examples](#api-gateway-examples)
2. [Patient Service Examples](#patient-service-examples)
3. [Doctor Service Examples](#doctor-service-examples)
4. [Appointment Service Examples](#appointment-service-examples)
5. [Billing Service Examples](#billing-service-examples)
6. [Medicine Service Examples](#medicine-service-examples)
7. [Frontend Integration Examples](#frontend-integration-examples)

---

## 🌐 API Gateway Examples

### 1. Complete Dashboard Aggregator Service

**File:** `api-gateway/src/services/aggregator/dashboardAggregator.js`

```javascript
const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');
const redisService = require('../cache/redisService');

class DashboardAggregator {
  constructor() {
    this.CACHE_TTL = {
      STATS: 30,
      TRENDS: 60,
      GROWTH: 3600,
      SYSTEM_HEALTH: 5,
    };
  }

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
        status: error.response?.status,
      });
      
      // Return null instead of throwing to allow partial data
      return null;
    }
  }

  async getDashboardStats() {
    const cacheKey = 'admin:stats:v1';
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.debug('Dashboard stats cache hit');
      return { ...cached, fromCache: true };
    }

    logger.info('Dashboard stats cache miss - fetching from services');
    const startTime = Date.now();

    try {
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

      const stats = {
        // KPI Cards
        totalPatients: this.extractValue(patientStats, 'data.totalPatients', 0),
        activePatients: this.extractValue(patientStats, 'data.activePatients', 0),
        activeDoctors: this.extractValue(doctorStats, 'data.activeDoctors', 0),
        onlineDoctors: this.extractValue(doctorStats, 'data.onlineNow', 0),
        todayAppointments: this.extractValue(appointmentStats, 'data.totalToday', 0),
        completedAppointments: this.extractValue(appointmentStats, 'data.completed', 0),
        pendingAppointments: this.extractValue(appointmentStats, 'data.pending', 0),
        revenueToday: this.extractValue(revenueStats, 'data.todayRevenue', 0),
        revenueMonth: this.extractValue(revenueStats, 'data.monthRevenue', 0),
        
        // Detailed Stats
        patients: this.extractData(patientStats),
        doctors: this.extractData(doctorStats),
        appointments: this.extractData(appointmentStats),
        revenue: this.extractData(revenueStats),
        medicine: this.extractData(medicineStats),
        
        // Metadata
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        fromCache: false,
      };

      await redisService.set(cacheKey, stats, this.CACHE_TTL.STATS);

      logger.info('Dashboard stats aggregated successfully', {
        responseTime: stats.responseTime,
        services: {
          patient: patientStats.status,
          doctor: doctorStats.status,
          appointment: appointmentStats.status,
          revenue: revenueStats.status,
          medicine: medicineStats.status,
        },
      });

      return stats;
    } catch (error) {
      logger.error('Failed to aggregate dashboard stats', error);
      throw error;
    }
  }

  extractData(result) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value.data || result.value;
    }
    logger.warn('Service data unavailable', { 
      status: result.status,
      reason: result.reason?.message 
    });
    return null;
  }

  extractValue(result, path, defaultValue) {
    if (result.status !== 'fulfilled' || !result.value) {
      return defaultValue;
    }
    
    const keys = path.split('.');
    let value = result.value;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return defaultValue;
    }
    
    return value ?? defaultValue;
  }

  async getSystemHealth() {
    const cacheKey = 'admin:system:health';
    
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const services = [
      { name: 'patient', endpoint: '/health' },
      { name: 'doctor', endpoint: '/health' },
      { name: 'appointment', endpoint: '/health' },
      { name: 'billing', endpoint: '/health' },
      { name: 'medicine', endpoint: '/health' },
      { name: 'notification', endpoint: '/health' },
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const start = Date.now();
        try {
          const result = await this.callService(service.name, service.endpoint, { 
            timeout: 3000 
          });
          return {
            name: service.name,
            status: 'healthy',
            responseTime: Date.now() - start,
            details: result?.data || result,
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            responseTime: Date.now() - start,
            error: error.message,
          };
        }
      })
    );

    const health = {
      services: healthChecks.map((result) => result.value || result.reason),
      overall: healthChecks.every(r => r.value?.status === 'healthy') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
    };

    await redisService.set(cacheKey, health, this.CACHE_TTL.SYSTEM_HEALTH);
    return health;
  }

  async invalidateCache(pattern) {
    logger.info('Invalidating cache', { pattern });
    await redisService.del(pattern);
  }
}

module.exports = new DashboardAggregator();
```

### 2. Socket.io Admin Namespace

**File:** `api-gateway/src/socket/adminSocket.js`

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

class AdminSocketManager {
  constructor() {
    this.io = null;
    this.adminNamespace = null;
  }

  initialize(server) {
    const socketIO = require('socket.io');
    
    this.io = socketIO(server, {
      path: '/admin-socket',
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.adminNamespace = this.io.of('/admin');

    // Authentication middleware
    this.adminNamespace.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.roles?.includes('ADMIN') && decoded.role !== 'ADMIN') {
          throw new Error('Not authorized as admin');
        }

        socket.user = decoded;
        logger.info('Admin socket authenticated', {
          userId: decoded.id,
          email: decoded.email,
        });
        
        next();
      } catch (err) {
        logger.warn('Admin socket authentication failed', { error: err.message });
        next(new Error('Authentication error'));
      }
    });

    this.adminNamespace.on('connection', (socket) => {
      logger.info('Admin connected', {
        userId: socket.user.id,
        socketId: socket.id,
      });

      // Subscribe to dashboard updates
      socket.on('subscribe:dashboard', () => {
        socket.join('dashboard');
        logger.debug('Admin subscribed to dashboard', { userId: socket.user.id });
      });

      // Subscribe to specific channels
      socket.on('subscribe:appointments', () => {
        socket.join('appointments');
      });

      socket.on('subscribe:alerts', () => {
        socket.join('alerts');
      });

      socket.on('disconnect', () => {
        logger.info('Admin disconnected', {
          userId: socket.user.id,
          socketId: socket.id,
        });
      });
    });

    logger.info('Admin Socket.io namespace initialized');
  }

  // Broadcast events
  broadcastDashboardUpdate(data) {
    if (this.adminNamespace) {
      this.adminNamespace.to('dashboard').emit('dashboard:stats:updated', data);
      logger.debug('Dashboard update broadcasted', { timestamp: data.timestamp });
    }
  }

  broadcastAppointmentCreated(appointment) {
    if (this.adminNamespace) {
      this.adminNamespace.to('dashboard').emit('appointment:created', appointment);
      this.adminNamespace.to('appointments').emit('appointment:created', appointment);
    }
  }

  broadcastAppointmentUpdated(appointment) {
    if (this.adminNamespace) {
      this.adminNamespace.to('dashboard').emit('appointment:updated', appointment);
      this.adminNamespace.to('appointments').emit('appointment:updated', appointment);
    }
  }

  broadcastAlert(alert) {
    if (this.adminNamespace) {
      this.adminNamespace.to('dashboard').emit('alert:new', alert);
      this.adminNamespace.to('alerts').emit('alert:new', alert);
    }
  }

  broadcastSystemHealth(health) {
    if (this.adminNamespace) {
      this.adminNamespace.to('dashboard').emit('system:health:changed', health);
    }
  }
}

module.exports = new AdminSocketManager();
```

### 3. Update app.js to initialize Socket.io

**File:** `api-gateway/src/app.js` (add at the end)

```javascript
// ... existing code ...

const adminSocket = require('./socket/adminSocket');

const server = app.listen(config.port, () => {
  logger.info(`Smart Health API Gateway started`, {
    port: config.port,
    environment: config.env,
    nodeVersion: process.version,
  });
});

// Initialize Admin Socket.io
adminSocket.initialize(server);

// ... rest of the code ...

module.exports = { app, server, adminSocket };
```

---

## 👥 Patient Service Examples

### Complete Admin Module Implementation

**File:** `patient/src/modules/admin/admin.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Patient } from '../patient/entities/patient.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async getPatientStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalPatients,
      activePatients,
      inactivePatients,
      newThisMonth,
      newThisWeek,
      newLastMonth,
    ] = await Promise.all([
      this.patientRepository.count(),
      this.patientRepository.count({ where: { isActive: true } }),
      this.patientRepository.count({ where: { isActive: false } }),
      this.patientRepository.count({
        where: { createdAt: MoreThan(startOfMonth) },
      }),
      this.patientRepository.count({
        where: { createdAt: MoreThan(startOfWeek) },
      }),
      this.patientRepository.count({
        where: {
          createdAt: Between(lastMonth, endOfLastMonth),
        },
      }),
    ]);

    const growthRate =
      newLastMonth > 0
        ? ((newThisMonth - newLastMonth) / newLastMonth) * 100
        : newThisMonth > 0 ? 100 : 0;

    return {
      totalPatients,
      activePatients,
      inactivePatients,
      newThisMonth,
      newThisWeek,
      newToday: await this.getNewToday(),
      growthRate: Math.round(growthRate * 10) / 10,
      averageAge: await this.getAverageAge(),
    };
  }

  private async getNewToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.patientRepository.count({
      where: { createdAt: Between(today, tomorrow) },
    });
  }

  private async getAverageAge(): Promise<number> {
    const result = await this.patientRepository
      .createQueryBuilder('patient')
      .select('AVG(TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()))', 'avgAge')
      .getRawOne();

    return Math.round(result?.avgAge || 0);
  }

  async getPatientGrowth(period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dateFormat: string;
    let groupBy: string;

    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        groupBy = "DATE(patient.createdAt)";
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        groupBy = "YEARWEEK(patient.createdAt)";
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        groupBy = "DATE_FORMAT(patient.createdAt, '%Y-%m')";
        break;
    }

    const result = await this.patientRepository
      .createQueryBuilder('patient')
      .select(`DATE_FORMAT(patient.createdAt, '${dateFormat}')`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('patient.createdAt >= :startDate', { startDate })
      .andWhere('patient.createdAt <= :endDate', { endDate })
      .groupBy(groupBy)
      .orderBy('date', 'ASC')
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
    const averagePerPeriod = totalGrowth / (data.length || 1);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data,
      summary: {
        totalGrowth,
        averagePerPeriod: Math.round(averagePerPeriod * 10) / 10,
        totalPeriods: data.length,
      },
    };
  }

  async getRecentPatients(limit: number = 10, offset: number = 0) {
    const [patients, total] = await this.patientRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'fullName',
        'email',
        'phone',
        'dateOfBirth',
        'gender',
        'isActive',
        'createdAt',
      ],
    });

    return {
      patients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getPatientDemographics() {
    const [byGender, byAgeGroup, byLocation] = await Promise.all([
      this.getGenderDistribution(),
      this.getAgeDistribution(),
      this.getLocationDistribution(),
    ]);

    return {
      byGender,
      byAgeGroup,
      byLocation,
    };
  }

  private async getGenderDistribution() {
    const result = await this.patientRepository
      .createQueryBuilder('patient')
      .select('patient.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .where('patient.gender IS NOT NULL')
      .groupBy('patient.gender')
      .getRawMany();

    return Object.fromEntries(
      result.map((g) => [g.gender || 'unknown', parseInt(g.count)]),
    );
  }

  private async getAgeDistribution() {
    const result = await this.patientRepository
      .createQueryBuilder('patient')
      .select(
        `CASE 
          WHEN TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()) < 18 THEN '0-17'
          WHEN TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
          WHEN TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
          WHEN TIMESTAMPDIFF(YEAR, patient.dateOfBirth, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
          ELSE '61+'
        END`,
        'ageGroup',
      )
      .addSelect('COUNT(*)', 'count')
      .where('patient.dateOfBirth IS NOT NULL')
      .groupBy('ageGroup')
      .getRawMany();

    return Object.fromEntries(
      result.map((a) => [a.ageGroup, parseInt(a.count)]),
    );
  }

  private async getLocationDistribution() {
    const result = await this.patientRepository
      .createQueryBuilder('patient')
      .select('patient.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('patient.city IS NOT NULL')
      .groupBy('patient.city')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map((l) => ({
      city: l.city,
      count: parseInt(l.count),
    }));
  }

  async searchPatients(query: string, limit: number = 20) {
    const patients = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.fullName LIKE :query', { query: `%${query}%` })
      .orWhere('patient.email LIKE :query', { query: `%${query}%` })
      .orWhere('patient.phone LIKE :query', { query: `%${query}%` })
      .select([
        'patient.id',
        'patient.fullName',
        'patient.email',
        'patient.phone',
        'patient.isActive',
      ])
      .limit(limit)
      .getMany();

    return patients;
  }
}
```

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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { InternalGuard } from '../../common/guards/internal.guard';

@Controller('v1/admin/patients')
@UseGuards(InternalGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    this.logger.debug('Fetching patient statistics');
    const startTime = Date.now();
    
    const stats = await this.adminService.getPatientStats();
    
    this.logger.log(`Patient stats retrieved in ${Date.now() - startTime}ms`);
    
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('growth')
  @HttpCode(HttpStatus.OK)
  async getGrowth(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    this.logger.debug(`Fetching patient growth: ${period}, ${days} days`);
    
    const growth = await this.adminService.getPatientGrowth(period, days);
    
    return {
      success: true,
      data: growth,
    };
  }

  @Get('recent')
  @HttpCode(HttpStatus.OK)
  async getRecent(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    this.logger.debug(`Fetching recent patients: limit=${limit}, offset=${offset}`);
    
    const result = await this.adminService.getRecentPatients(limit, offset);
    
    return {
      success: true,
      ...result,
    };
  }

  @Get('demographics')
  @HttpCode(HttpStatus.OK)
  async getDemographics() {
    this.logger.debug('Fetching patient demographics');
    
    const demographics = await this.adminService.getPatientDemographics();
    
    return {
      success: true,
      data: demographics,
    };
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async search(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    this.logger.debug(`Searching patients: "${query}"`);
    
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
        message: 'Query parameter required',
      };
    }
    
    const patients = await this.adminService.searchPatients(query, limit);
    
    return {
      success: true,
      data: patients,
      count: patients.length,
    };
  }
}
```

---

## 👨‍⚕️ Doctor Service Examples

**File:** `doctor/src/modules/admin/admin.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Doctor } from '../doctor/entities/doctor.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async getDoctorStats() {
    const [
      totalDoctors,
      activeDoctors,
      verifiedDoctors,
      onlineNow,
    ] = await Promise.all([
      this.doctorRepository.count(),
      this.doctorRepository.count({ where: { isActive: true } }),
      this.doctorRepository.count({ where: { isVerified: true } }),
      this.doctorRepository.count({ where: { isOnline: true } }),
    ]);

    const avgRating = await this.getAverageRating();

    return {
      totalDoctors,
      activeDoctors,
      verifiedDoctors,
      onlineNow,
      pendingVerification: totalDoctors - verifiedDoctors,
      averageRating: avgRating,
    };
  }

  private async getAverageRating(): Promise<number> {
    const result = await this.doctorRepository
      .createQueryBuilder('doctor')
      .select('AVG(doctor.rating)', 'avgRating')
      .where('doctor.rating IS NOT NULL')
      .getRawOne();

    return Math.round((result?.avgRating || 0) * 10) / 10;
  }

  async getTopDoctors(limit: number = 10, sortBy: 'rating' | 'appointments' = 'rating') {
    const queryBuilder = this.doctorRepository
      .createQueryBuilder('doctor')
      .select([
        'doctor.id',
        'doctor.fullName',
        'doctor.specialty',
        'doctor.rating',
        'doctor.totalAppointments',
        'doctor.yearsOfExperience',
        'doctor.avatar',
      ])
      .where('doctor.isActive = :isActive', { isActive: true })
      .limit(limit);

    if (sortBy === 'rating') {
      queryBuilder.orderBy('doctor.rating', 'DESC');
    } else {
      queryBuilder.orderBy('doctor.totalAppointments', 'DESC');
    }

    const doctors = await queryBuilder.getMany();

    return {
      sortBy,
      limit,
      doctors,
    };
  }

  async getDepartmentPerformance() {
    const result = await this.doctorRepository
      .createQueryBuilder('doctor')
      .select('doctor.specialty', 'department')
      .addSelect('COUNT(*)', 'doctorCount')
      .addSelect('AVG(doctor.rating)', 'avgRating')
      .addSelect('SUM(doctor.totalAppointments)', 'totalAppointments')
      .where('doctor.isActive = :isActive', { isActive: true })
      .groupBy('doctor.specialty')
      .orderBy('totalAppointments', 'DESC')
      .getRawMany();

    return result.map((dept) => ({
      department: dept.department,
      doctorCount: parseInt(dept.doctorCount),
      avgRating: Math.round(parseFloat(dept.avgRating) * 10) / 10,
      totalAppointments: parseInt(dept.totalAppointments || 0),
    }));
  }

  async getDoctorAvailability() {
    const total = await this.doctorRepository.count({ 
      where: { isActive: true } 
    });
    
    const available = await this.doctorRepository.count({
      where: { isActive: true, isAvailable: true },
    });

    const busy = total - available;

    return {
      total,
      available,
      busy,
      availabilityRate: total > 0 ? Math.round((available / total) * 100) : 0,
    };
  }
}
```

---

## 📅 Appointment Service Examples

**File:** `appointment/src/module/admin/admin.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../appointment/entities/appointment.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async getAppointmentStats() {
    const today = this.getToday();
    const tomorrow = this.getTomorrow();

    const [
      totalToday,
      completed,
      pending,
      confirmed,
      cancelled,
      noShow,
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
      this.appointmentRepository.count({
        where: {
          appointmentDate: Between(today, tomorrow),
          status: 'no_show',
        },
      }),
      this.getStatusDistribution(),
      this.getTypeDistribution(),
    ]);

    const completionRate = totalToday > 0 ? Math.round((completed / totalToday) * 100) : 0;

    return {
      totalToday,
      completed,
      pending,
      confirmed,
      cancelled,
      noShow,
      completionRate,
      distribution: {
        byStatus,
        byType,
      },
    };
  }

  private getToday(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getTomorrow(): Date {
    const date = this.getToday();
    date.setDate(date.getDate() + 1);
    return date;
  }

  private async getStatusDistribution() {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appointment.status')
      .getRawMany();

    return Object.fromEntries(
      result.map((s) => [s.status, parseInt(s.count)]),
    );
  }

  private async getTypeDistribution() {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('appointment.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('appointment.type IS NOT NULL')
      .groupBy('appointment.type')
      .getRawMany();

    return Object.fromEntries(
      result.map((t) => [t.type, parseInt(t.count)]),
    );
  }

  async getAppointmentTrends(days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select("DATE(appointment.appointmentDate)", 'date')
      .addSelect('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('appointment.appointmentDate >= :startDate', { startDate })
      .andWhere('appointment.appointmentDate <= :endDate', { endDate })
      .groupBy("DATE(appointment.appointmentDate)")
      .addGroupBy('appointment.status')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Group by date
    const groupedByDate = {};
    result.forEach((row) => {
      if (!groupedByDate[row.date]) {
        groupedByDate[row.date] = { date: row.date, total: 0, byStatus: {} };
      }
      const count = parseInt(row.count);
      groupedByDate[row.date].byStatus[row.status] = count;
      groupedByDate[row.date].total += count;
    });

    return {
      period: `${days} days`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data: Object.values(groupedByDate),
    };
  }

  async getRecentAppointments(limit: number = 10, offset: number = 0) {
    const [appointments, total] = await this.appointmentRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['patient', 'doctor'],
      select: {
        id: true,
        appointmentDate: true,
        status: true,
        type: true,
        reason: true,
        createdAt: true,
        patient: { id: true, fullName: true, phone: true },
        doctor: { id: true, fullName: true, specialty: true },
      },
    });

    return {
      appointments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getHourlyDistribution() {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('HOUR(appointment.appointmentDate)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('appointment.appointmentDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      hour: parseInt(r.hour),
      count: parseInt(r.count),
      label: `${r.hour}:00`,
    }));
  }
}
```

---

## 💰 Billing Service Examples (Spring Boot)

**File:** `billing/src/main/java/com/smarthealth/billing/admin/AdminController.java`

```java
package com.smarthealth.billing.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/admin/revenue")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getRevenueStats() {
        log.debug("Fetching revenue statistics");
        
        try {
            RevenueStatsDTO stats = adminService.getRevenueStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching revenue stats", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch revenue statistics");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/distribution")
    public ResponseEntity<Map<String, Object>> getRevenueDistribution() {
        log.debug("Fetching revenue distribution");
        
        try {
            RevenueDistributionDTO distribution = adminService.getRevenueDistribution();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", distribution);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching revenue distribution", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch revenue distribution");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/trends")
    public ResponseEntity<Map<String, Object>> getRevenueTrends(
            @RequestParam(defaultValue = "30") int days) {
        log.debug("Fetching revenue trends for {} days", days);
        
        try {
            RevenueTrendsDTO trends = adminService.getRevenueTrends(days);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", trends);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching revenue trends", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch revenue trends");
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
```

**File:** `billing/src/main/java/com/smarthealth/billing/admin/AdminService.java`

```java
package com.smarthealth.billing.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class AdminService {

    @Autowired
    private PaymentRepository paymentRepository;

    public RevenueStatsDTO getRevenueStats() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate startOfYear = today.withDayOfYear(1);

        Double todayRevenue = paymentRepository.sumAmountByDate(today);
        Double monthRevenue = paymentRepository.sumAmountBetweenDates(
            startOfMonth.atStartOfDay(), 
            LocalDateTime.now()
        );
        Double yearRevenue = paymentRepository.sumAmountBetweenDates(
            startOfYear.atStartOfDay(), 
            LocalDateTime.now()
        );

        // Calculate growth
        LocalDate lastMonthStart = startOfMonth.minusMonths(1);
        LocalDate lastMonthEnd = startOfMonth.minusDays(1);
        Double lastMonthRevenue = paymentRepository.sumAmountBetweenDates(
            lastMonthStart.atStartOfDay(),
            lastMonthEnd.atTime(23, 59, 59)
        );

        double growthRate = 0.0;
        if (lastMonthRevenue != null && lastMonthRevenue > 0) {
            growthRate = ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
        }

        RevenueStatsDTO stats = new RevenueStatsDTO();
        stats.setTodayRevenue(todayRevenue != null ? todayRevenue : 0.0);
        stats.setMonthRevenue(monthRevenue != null ? monthRevenue : 0.0);
        stats.setYearRevenue(yearRevenue != null ? yearRevenue : 0.0);
        stats.setGrowthRate(Math.round(growthRate * 10.0) / 10.0);
        stats.setLastMonthRevenue(lastMonthRevenue != null ? lastMonthRevenue : 0.0);

        return stats;
    }

    public RevenueDistributionDTO getRevenueDistribution() {
        List<Object[]> byService = paymentRepository.getDistributionByService();
        List<Object[]> byMethod = paymentRepository.getDistributionByPaymentMethod();

        Map<String, Double> serviceMap = new HashMap<>();
        for (Object[] row : byService) {
            serviceMap.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        Map<String, Double> methodMap = new HashMap<>();
        for (Object[] row : byMethod) {
            methodMap.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        RevenueDistributionDTO distribution = new RevenueDistributionDTO();
        distribution.setByService(serviceMap);
        distribution.setByPaymentMethod(methodMap);

        return distribution;
    }

    public RevenueTrendsDTO getRevenueTrends(int days) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(days);

        List<Object[]> dailyRevenue = paymentRepository.getDailyRevenueBetweenDates(
            startDate, 
            endDate
        );

        List<DailyRevenueDTO> trends = new ArrayList<>();
        for (Object[] row : dailyRevenue) {
            DailyRevenueDTO daily = new DailyRevenueDTO();
            daily.setDate(row[0].toString());
            daily.setAmount(((Number) row[1]).doubleValue());
            daily.setTransactionCount(((Number) row[2]).intValue());
            trends.add(daily);
        }

        RevenueTrendsDTO result = new RevenueTrendsDTO();
        result.setPeriod(days + " days");
        result.setStartDate(startDate.toLocalDate().toString());
        result.setEndDate(endDate.toLocalDate().toString());
        result.setData(trends);

        return result;
    }
}
```

---

## 🌐 Frontend Integration Examples

### React Hook for Dashboard Data

**File:** `src/hooks/useAdminDashboard.ts`

```typescript
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  activeDoctors: number;
  todayAppointments: number;
  revenueToday: number;
  // ... other fields
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    initializeSocket();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/admin/dashboard/stats');
      setStats(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    
    const newSocket = io('http://localhost:8080/admin', {
      path: '/admin-socket',
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Admin socket connected');
      newSocket.emit('subscribe:dashboard');
    });

    newSocket.on('dashboard:stats:updated', (data) => {
      console.log('Dashboard stats updated', data);
      setStats(data);
    });

    newSocket.on('appointment:created', (appointment) => {
      console.log('New appointment', appointment);
      // Refresh stats
      fetchDashboardStats();
    });

    newSocket.on('disconnect', () => {
      console.log('Admin socket disconnected');
    });

    setSocket(newSocket);
  };

  return {
    stats,
    loading,
    error,
    refresh: fetchDashboardStats,
  };
};
```

### API Client Setup

**File:** `src/lib/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🧪 Testing Examples

### API Gateway Integration Test

**File:** `api-gateway/test/admin.test.js`

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Admin Dashboard API', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin
    const response = await request(app)
      .post('/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123',
      });
    
    adminToken = response.body.token;
  });

  describe('GET /v1/admin/dashboard/stats', () => {
    it('should return dashboard stats', async () => {
      const response = await request(app)
        .get('/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPatients');
      expect(response.body.data).toHaveProperty('activeDoctors');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/v1/admin/dashboard/stats');

      expect(response.status).toBe(401);
    });
  });
});
```

---

This documentation provides complete, production-ready code examples for integrating admin dashboard APIs across all your existing services! 🚀