import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { AppointmentsModule } from './module/appointment/appointment.module';
import { MedicalRecordsModule } from './module/medical_records/medical-records.module';
import { VitalSignsModule } from './module/vital_signs/vital-signs.module';
import { LabTestsModule } from './module/lab_tests/lab-tests.module';
import { FollowUpSuggestionsModule } from './module/follow_up_suggestions/follow_up_suggestions.module';

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

    // SMTP Mailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = process.env.NODE_ENV === 'production';
        return {
          transport: {
            host: config.get<string>('SMTP_HOST'),
            port: config.get<number>('SMTP_PORT'),
            secure: false,
            auth: {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            },
          },
          defaults: {
            from: config.get<string>('SMTP_FROM'),
          },
          template: {
            dir: isProd
              ? join(process.cwd(), 'dist', 'templates')
              : join(process.cwd(), 'src', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),

    AppointmentsModule,
    MedicalRecordsModule,
    VitalSignsModule,
    LabTestsModule,
    FollowUpSuggestionsModule,
  ],
})
export class AppModule { }
