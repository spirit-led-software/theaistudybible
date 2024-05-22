import nodemailer from 'nodemailer';

export const emailTransport = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USERNAME,
    pass: process.env.EMAIL_SERVER_PASSWORD
  },
  from: process.env.EMAIL_SERVER_USERNAME
});
