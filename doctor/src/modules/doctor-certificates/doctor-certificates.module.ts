import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorCertificateService } from './doctor-certificates.service';
import { DoctorCertificateController } from './doctor-certificates.controller';
import { DoctorCertificate } from './doctor-certificates.entity';
import { Doctor } from '../doctor/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorCertificate, Doctor])],
  providers: [DoctorCertificateService],
  controllers: [DoctorCertificateController],
  exports: [DoctorCertificateService],
})
export class DoctorCertificateModule {}
