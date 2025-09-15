import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorBlockTimeService } from './doctor-block-time.service';
import { DoctorBlockTimeController } from './doctor-block-time.controller';
import { DoctorBlockTime } from './doctor-block-time.entity';
import { Doctor } from '../doctor/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorBlockTime, Doctor])],
  providers: [DoctorBlockTimeService],
  controllers: [DoctorBlockTimeController],
  exports: [DoctorBlockTimeService],
})
export class DoctorBlockTimeModule {}
