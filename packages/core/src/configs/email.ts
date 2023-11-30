import nodemailer from 'nodemailer';

export type EmailConfig = {
  from: string;
  replyTo: string;
  host: string;
  port: number;
  credentials: {
    username: string;
    password: string;
  };
};

export const config: EmailConfig = {
  from: process.env.EMAIL_FROM!,
  replyTo: process.env.EMAIL_REPLY_TO!,
  host: process.env.EMAIL_SERVER_HOST!,
  port: parseInt(process.env.EMAIL_SERVER_PORT!),
  credentials: {
    username: process.env.EMAIL_SERVER_USERNAME!,
    password: process.env.EMAIL_SERVER_PASSWORD!
  }
};

export const emailTransport = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  auth: {
    user: config.credentials.username,
    pass: config.credentials.password
  },
  from: config.from
});

export default config;
