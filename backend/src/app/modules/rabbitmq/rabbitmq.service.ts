import { Injectable, Logger } from '@nestjs/common';
import { Channel, Connection, ConsumeMessage, connect } from 'amqplib';
import { config } from '../../config/rabbitmq.config';

@Injectable()
export class RabbitmqService {
  private connection: Connection;
  private channel: Channel;

  async initialize() {
    this.connection = await connect({
      hostname: config.host,
      port: config.port,
      vhost: config.vhost,
      username: config.username,
      password: config.password,
      protocol: 'amqp',
    });
    this.channel = await this.connection.createChannel();
  }

  async sendMessage(queue: string, message: any) {
    await this.channel.assertQueue(queue);
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async consumeMessage(
    queue: string,
    callback: (message: any) => Promise<boolean>,
  ) {
    await this.channel.assertQueue(queue);
    this.channel
      .consume(queue, (message) => {
        callback(JSON.parse(message.content.toString()))
          .then((result) => {
            if (result) {
              this.channel.ack(message);
            } else {
              this.submitRetry(queue, message);
            }
          })
          .catch((error) => {
            Logger.error(error);
            this.submitRetry(queue, message);
          });
      })
      .then((result) => {
        Logger.log(result);
      })
      .catch((error) => {
        Logger.error(error);
      });
  }

  submitRetry(queue: string, message: ConsumeMessage) {
    this.channel.nack(message, false, false);
    setTimeout(() => {
      this.channel.sendToQueue(queue, Buffer.from(message.content.toString()));
    }, 5000);
  }

  async closeConnection() {
    await this.channel.close();
    await this.connection.close();
  }
}
