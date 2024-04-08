import nodemailer from 'nodemailer';
import config from '../configs/revelationsai';

export const emailTransport = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.credentials.username,
    pass: config.email.credentials.password
  },
  from: config.email.from
});
