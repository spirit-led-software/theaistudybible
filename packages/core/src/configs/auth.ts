interface AuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
  };
  facebook: {
    clientId: string;
    clientSecret: string;
  };
  email: {
    from: string;
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  adminUser: {
    email: string;
  };
}

export const config: AuthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  },
  email: {
    from: process.env.EMAIL_FROM!,
    host: process.env.EMAIL_SERVER_HOST!,
    port: parseInt(process.env.EMAIL_SERVER_PORT!),
    credentials: {
      username: process.env.EMAIL_SERVER_USERNAME!,
      password: process.env.EMAIL_SERVER_PASSWORD!,
    },
  },
  adminUser: {
    email: process.env.ADMIN_EMAIL!,
  },
};

export default config;
