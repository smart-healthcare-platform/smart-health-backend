import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { randomUUID } from 'crypto';

@Injectable()
export class AppointmentProducerService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentProducerService.name);
  private readonly pending = new Map<string, (data: any) => void>();

  constructor(@Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka) { }

  async onModuleInit() {
    await this.kafka.connect();
    this.logger.log('Kafka producer connected');
  }

  async requestBooking(data: { id: string; doctorId: string; slotId: string; userId: string }) {
    const correlationId = randomUUID();

    const payload = {
      appointmentId: data.id,
      doctorId: data.doctorId,
      slotId: data.slotId,
      userId: data.userId,
      correlationId,
    };

    this.logger.log(`Publishing booking request: ${JSON.stringify(payload)}`);
    this.kafka.emit('appointment.book.requested', payload);

    return { success: true, message: 'Booking request sent' };
  }

  // hàm này sẽ được gọi bởi consumer khi có reply
  handleReply(message: any) {
    const { correlationId } = message;
    const resolver = this.pending.get(correlationId);
    if (resolver) {
      resolver(message);
      this.pending.delete(correlationId);
    } else {
      this.logger.warn(`No pending request found for correlationId=${correlationId}`);
    }
  }

  // appointment-producer.service.ts
async requestPatientDetail(patientId: string): Promise<any> {
  const correlationId = randomUUID()

  const payload = {
    patientId,
    correlationId,
  }

  this.logger.log(`Publishing patient detail request: ${JSON.stringify(payload)}`)
  this.kafka.emit('patient.detail.requested', payload)

  // Tạo promise chờ phản hồi
  return new Promise((resolve) => {
    this.pending.set(correlationId, resolve)

    setTimeout(() => {
      if (this.pending.has(correlationId)) {
        this.pending.delete(correlationId)
        resolve(null)
      }
    }, 5000)
  })
}

}
