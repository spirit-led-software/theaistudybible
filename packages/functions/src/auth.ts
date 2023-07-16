import config from "@core/configs/auth";
import nodemailer from "nodemailer";
import { AuthHandler, LinkAdapter } from "sst/node/auth";

export const handler = AuthHandler({
  providers: {
    link: LinkAdapter({
      onLink: async (link, claims) => {
        const transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          auth: {
            user: config.email.credentials.username,
            pass: config.email.credentials.password,
          },
          from: config.email.from,
        });

        transporter.sendMail({
          to: claims.email,
          subject: "Login Link",
          text: link,
        });

        return {
          statusCode: 200,
          body: "OK",
        };
      },
      onSuccess: async (claims) => {
        return {
          statusCode: 200,
        };
      },
      onError: async () => {
        return {
          statusCode: 500,
          body: "Internal Server Error",
        };
      },
    }),
  },
});
