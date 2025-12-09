import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Appointment } from '../appointment/appointment.entity';

/**
 * Admin Module
 * Provides admin endpoints for appointment analytics and statistics
 * Protected by InternalGuard - only accessible from API Gateway
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}