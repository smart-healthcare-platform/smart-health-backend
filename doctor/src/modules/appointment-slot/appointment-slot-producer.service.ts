import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AppointmentSlotProducerService implements OnModuleInit {
  constructor(@Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka) { }

  async onModuleInit() {
    await this.kafka.connect();
    console.log('📡 Doctor producer connected');
  }

  confirmSlot(data: { appointmentId: string; doctorId: string; slotId: string }) {
    console.log('📤 Gửi slot confirmed:', data);
    return this.kafka.emit('appointment.slot.confirmed', data);
  }

  failSlot(data: { appointmentId: string; doctorId: string; slotId: string }) {
    console.log('📤 Gửi slot failed:', data);
    return this.kafka.emit('appointment.slot.failed', data);
  }
}