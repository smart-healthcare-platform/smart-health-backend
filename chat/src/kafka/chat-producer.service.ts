import { Kafka, Producer } from 'kafkajs';
import { createKafkaConfig } from './kafka.config';

export class ChatProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private connected: boolean = false;
  private static instance: ChatProducerService;

  private constructor() {
    const { broker, clientId } = createKafkaConfig();
    
    this.kafka = new Kafka({
      clientId,
      brokers: [broker],
    });

    this.producer = this.kafka.producer();
  }

  public static getInstance(): ChatProducerService {
    if (!ChatProducerService.instance) {
      ChatProducerService.instance = new ChatProducerService();
    }
    return ChatProducerService.instance;
  }

  async connect() {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
      console.log('[Kafka Producer] Chat service producer connected successfully');
    }
  }

  async publishNewMessageEvent(data: {
    recipientId: string;
    senderId: string;
    senderName: string;
    messageContent: string;
    conversationId: string;
  }) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      await this.producer.send({
        topic: 'message.new',
        messages: [
          {
            value: JSON.stringify({
              recipientId: data.recipientId,
              senderId: data.senderId,
              senderName: data.senderName,
              messageContent: data.messageContent,
              conversationId: data.conversationId,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(`[Kafka Producer] Published message.new event for recipient ${data.recipientId}`);
    } catch (error: any) {
      console.error('[Kafka Producer] Error publishing message.new event:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log('[Kafka Producer] Chat service producer disconnected');
    }
  }
}

export const chatProducer = ChatProducerService.getInstance();