import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { KafkaConsumerService } from './kafka-consumer.service';

@Controller()
export class NotificationKafkaController {
  constructor(private readonly kafkaConsumerService: KafkaConsumerService) {}

  @EventPattern('appointment.confirmed')
  async handleAppointmentConfirmed(data: any) {
    // This method is primarily for NestJS to recognize the event pattern.
    // The actual handling is done by KafkaConsumerService.
    // Data is processed within KafkaConsumerService.
  }

  @EventPattern('message.new')
  async handleNewMessage(data: any) {
    // This method is primarily for NestJS to recognize the event pattern.
    // The actual handling is done by KafkaConsumerService.
    // Data is processed within KafkaConsumerService.
  }
}
