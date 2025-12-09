import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DoctorModule } from './modules/doctor/doctor.module';
import { DoctorCertificateModule } from './modules/doctor-certificates/doctor-certificates.module';
import { AppointmentSlotModule } from './modules/appointment-slot/appointment-slot.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    DoctorModule,
    DoctorCertificateModule,
    AppointmentSlotModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
