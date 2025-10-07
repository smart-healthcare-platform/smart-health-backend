import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { PatientService } from './patient.service';
import { PatientProducerService } from './patient-producer.service';

interface UserCreatedEvent {
  id: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

interface AppointmentBookedEvent {
  appointmentId: string;
  userId: string;
  doctorId: string;
  slotId: string;
  correlationId: string;
}

@Injectable()
export class PatientConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PatientConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly patientService: PatientService,
    private readonly producer: PatientProducerService,
  ) { }

  async onModuleInit() {
    this.logger.log('Starting Patient Kafka Consumer...');

    this.kafka = new Kafka({
      clientId: 'patient-service-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.consumer = this.kafka.consumer({ groupId: 'patient-service-group' });
    await this.consumer.connect();
    this.logger.log('Kafka consumer connected');

    await this.consumer.subscribe({ topic: 'appointment.book.requested', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'user.created', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'patient.detail.requested', fromBeginning: false });
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawValue = message.value?.toString();
          if (!rawValue) return;

          const data = JSON.parse(rawValue);

          switch (topic) {
            case 'user.created': {
              const userEvent: UserCreatedEvent = data;
              this.logger.log(`Received [user.created]: ${JSON.stringify(userEvent)}`);
              await this.patientService.createFromUser(userEvent);
              break;
            }

            case 'appointment.book.requested': {
              const appointmentEvent: AppointmentBookedEvent = data;
              this.logger.log(`Received [appointment.book.requested]: ${JSON.stringify(appointmentEvent)}`);

              const patient = await this.patientService.findByUserId(appointmentEvent.userId);

              // gửi event mới cho Doctor
              await this.producer.forwardToDoctor({
                correlationId: appointmentEvent.correlationId,
                appointmentId: appointmentEvent.appointmentId,
                slotId: appointmentEvent.slotId,
                doctorId: appointmentEvent.doctorId,
                patientId: patient.id,
                patientName: patient.full_name,
              });

              this.logger.log(`Forwarded to doctor for appointment ${appointmentEvent.appointmentId}`);
              break;
            }
            case 'patient.detail.requested': {
              const { patientId, correlationId } = data;
              this.logger.log(`📥 Received [patient.detail.requested]: ${JSON.stringify(data)}`);

              try {
                const patient = await this.patientService.findOne(patientId);
                if (!patient) {
                  this.logger.warn(`⚠️ Patient ${patientId} not found`);
                  await this.producer.replyPatientDetail({
                    correlationId,
                    patientId,
                    found: false,
                  });
                  break;
                }

                await this.producer.replyPatientDetail({
                  correlationId,
                  patientId,
                  found: true,
                  patient: {
                    id: patient.id,
                    fullName: patient.full_name,
                    gender: patient.gender,
                    dateOfBirth: patient.date_of_birth,
                    address: patient.address,
                  },
                });

                this.logger.log(`✅ Sent [patient.detail.resolved] for patientId=${patientId}`);
              } catch (err) {
                this.logger.error(`❌ Error resolving patient.detail.requested: ${err.message}`);
              }
              break;
            }
            default:
              this.logger.warn(`⚠️ Unhandled topic: ${topic}`);
          }
        } catch (err) {
          this.logger.error(
            `Error processing message from ${topic} [partition: ${partition}, offset: ${message.offset}] - ${err.message}`,
          );
        }
      },
    });

    this.logger.log('🎧 Patient Kafka Consumer is now running');
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Patient Kafka Consumer disconnected');
    }
  }
}
