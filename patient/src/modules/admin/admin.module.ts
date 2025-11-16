import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Patient } from '../patient/patient.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InternalGuard } from './guards/internal.guard';

/**
 * Admin Module
 * Provides admin endpoints for patient analytics and statistics
 * Protected by InternalGuard - only accessible from API Gateway
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
    ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, InternalGuard],
  exports: [AdminService],
})
export class AdminModule {}