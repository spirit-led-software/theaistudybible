type RabbitmqConfig = {
  host: string;
  port: number;
  vhost: string;
  username: string;
  password: string;
};

export const config: RabbitmqConfig = {
  host: process.env.RABBITMQ_HOST || 'localhost',
  port: parseInt(process.env.RABBITMQ_PORT) || 5672,
  vhost: process.env.RABBITMQ_VHOST || '/',
  username: process.env.RABBITMQ_USER,
  password: process.env.RABBITMQ_PASSWORD,
};
