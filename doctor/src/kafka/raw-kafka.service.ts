import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';

@Injectable()
export class RawKafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  async onModuleInit() {
    console.log('🔧 Starting RAW Kafka consumer...');
    
    this.kafka = new Kafka({
      clientId: 'raw-doctor-test',
      brokers: ['localhost:9092'],
    });

    this.consumer = this.kafka.consumer({ 
      groupId: 'raw-doctor-test-group',
      allowAutoTopicCreation: true,
    });

    try {
      await this.consumer.connect();
      console.log('✅ RAW Kafka consumer connected');

      await this.consumer.subscribe({ 
        topic: 'appointment.book.requested',
        fromBeginning: true, // Read từ đầu để test
      });
      console.log('✅ RAW Consumer subscribed to appointment.book.requested');

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          console.log('🔥 RAW KAFKA MESSAGE RECEIVED:');
          console.log('📍 Topic:', topic);
          console.log('📍 Partition:', partition);
          console.log('📍 Offset:', message.offset);
          console.log('📍 Key:', message.key?.toString());
          console.log('📥 Value:', message.value?.toString());
          console.log('⏰ Timestamp:', message.timestamp);
          console.log('=====================================\n');

          // Call heartbeat để maintain connection
          await heartbeat();
        },
      });

      console.log('✅ RAW Consumer is running...');
    } catch (error) {
      console.error('❌ RAW Kafka consumer error:', error);
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      console.log('🔌 RAW Kafka consumer disconnected');
    }
  }
}