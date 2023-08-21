interface AuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
  };
  facebook: {
    clientId: string;
    clientSecret: string;
  };
  adminUser: {
    email: string;
    password: string;
  };
  bcrypt: {
    saltRounds: number;
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
  adminUser: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  },
  bcrypt: {
    saltRounds: 10,
  },
};

export default config;
