import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { DoctorSeed } from './doctor.seed';
import { Doctor } from './doctor.entity';
import { DoctorCertificate } from '../doctor-certificates/doctor-certificates.entity';
import { DoctorWeeklyAvailability } from '../doctor-schedule/entity/doctor-weekly-availability.entity';
import { DoctorBlockTime } from '../doctor-schedule/entity/doctor-block-time.entity';
import { DoctorRating } from '../doctor-rating/doctor-rating.entity';
import { AppointmentSlot } from '../appointment-slot/appointment-slot.entity';
import { AppointmentSlotModule } from '../appointment-slot/appointment-slot.module';
import { CacheModule } from '@nestjs/cache-manager';
import { DoctorKafkaModule } from 'src/kafka/doctor.kafka.module';
import { DoctorSpecialAvailability } from '../doctor-schedule/entity/doctor-special-availability.entity';
import { DoctorCertificateModule } from '../doctor-certificates/doctor-certificates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      DoctorCertificate,
      DoctorWeeklyAvailability,
      DoctorSpecialAvailability,
      DoctorBlockTime,
      DoctorRating,
      AppointmentSlot,
    ]),
    AppointmentSlotModule,
    DoctorCertificateModule,
    CacheModule.register({ isGlobal: true }),
    forwardRef(() => DoctorKafkaModule),
  ],
  controllers: [DoctorController],
  providers: [DoctorService, DoctorSeed],
  exports: [DoctorService],
})
export class DoctorModule { }
