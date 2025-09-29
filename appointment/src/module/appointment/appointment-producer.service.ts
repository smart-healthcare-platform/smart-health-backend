import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AppointmentProducerService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentProducerService.name);
  private readonly pending = new Map<string, (data: any) => void>();

  constructor(@Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka) {}

  async onModuleInit() {
    await this.kafka.connect();
    this.logger.log('Kafka producer connected');
  }

  async requestBooking(data: { id: string; doctorId: string; slotId: string; userId: string }) {
    const payload = {
      appointmentId: data.id,
      doctorId: data.doctorId,
      slotId: data.slotId,
      userId: data.userId,
    };

    this.logger.log(`Sending booking request: ${JSON.stringify(payload)}`);

    await this.kafka.emit('appointment.book.requested', payload).toPromise();
    return { success: true, message: 'Booking request sent' };
  }
}
