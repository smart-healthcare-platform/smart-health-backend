export const createKafkaConfig = () => {
  const broker = process.env.KAFKA_BROKER || 'localhost:9092';
  const clientId = process.env.KAFKA_CLIENT_ID || 'chat-service';

  return {
    broker,
    clientId,
  };
};