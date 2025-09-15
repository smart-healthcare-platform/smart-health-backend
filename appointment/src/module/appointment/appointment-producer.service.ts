import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AppointmentProducerService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentProducerService.name);

  constructor(@Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka) { }

  async onModuleInit() {
    await this.kafka.connect();
    this.logger.log('Kafka producer connected');
  }

  async requestBooking(data: { id: string; doctorId: string; slotId: string; patientId: string }) {
    const payload = {
      appointmentId: data.id,
      doctorId: data.doctorId,
      slotId: data.slotId,
      patientId: data.patientId,
    };
    
    this.logger.log('Sending booking request:', payload);
    
    try {
      // Use emit for fire-and-forget
      this.kafka.emit('appointment.book.requested', payload);
      this.logger.log('Booking request sent successfully');
      return { success: true, message: 'Booking request sent' };
    } catch (error) {
      this.logger.error('Failed to send booking request:', error);
      throw error;
    }
  }
}