import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DoctorModule } from './modules/doctor/doctor.module';
import { AppointmentSlotModule } from './modules/appointment-slot/appointment-slot.module';
import { DoctorKafkaModule } from './kafka/doctor.kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    AppointmentSlotModule,
    DoctorKafkaModule
  ],
})
export class AppModule {}
