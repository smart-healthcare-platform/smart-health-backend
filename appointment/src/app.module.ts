import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppointmentsModule } from './module/appointment/appointment.module';
import { MedicalRecordsModule } from './module/medical_records/medical-records.module';
import { VitalSignsModule } from './module/vital_signs/vital-signs.module';
import { LabTestsModule } from './module/lab_tests/lab-tests.module';
import { FollowUpSuggestionsModule } from './module/follow_up_suggestions/follow_up_suggestions.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AppointmentsModule,
    MedicalRecordsModule,
    VitalSignsModule,
    LabTestsModule,
    FollowUpSuggestionsModule,
    KafkaModule
  ],
})
export class AppModule { }
