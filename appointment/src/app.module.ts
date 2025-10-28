import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppointmentModule } from './module/appointment/appointment.module';
import { MedicalRecordsModule } from './module/medical-records/medical-records.module';
import { VitalSignsModule } from './module/vital-signs/vital-signs.module';
import { LabTestsModule } from './module/lab-tests/lab-tests.module';
import { FollowUpSuggestionModule } from './module/follow-up-suggestion/follow-up-suggestion.module';
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
    AppointmentModule,
    MedicalRecordsModule,
    VitalSignsModule,
    LabTestsModule,
    FollowUpSuggestionModule,
    KafkaModule
  ],
})
export class AppModule { }
