import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorRatingService } from './doctor-rating.service';
import { DoctorRatingController } from './doctor-rating.controller';
import { DoctorRating } from './doctor-rating.entity';
import { Doctor } from '../doctor/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorRating, Doctor])],
  providers: [DoctorRatingService],
  controllers: [DoctorRatingController],
  exports: [DoctorRatingService],
})
export class DoctorRatingModule {}
