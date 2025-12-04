import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorCertificateService } from './doctor-certificates.service';
import { DoctorCertificateController } from './doctor-certificates.controller';
import { DoctorCertificate } from './doctor-certificates.entity';
import { Doctor } from '../doctor/doctor.entity';
import { DoctorModule } from '../doctor/doctor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorCertificate, Doctor]), 
    forwardRef(() => DoctorModule), 
  ],
  providers: [DoctorCertificateService],
  controllers: [DoctorCertificateController],
  exports: [DoctorCertificateService],
})
export class DoctorCertificateModule { }
