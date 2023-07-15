export declare module "auth" {
  interface OAuthProvider {
    clientId: string;
    clientSecret: string;
  }

  interface AuthConfig {
    google: OAuthProvider;
    facebook: OAuthProvider;
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
      password: string;
    };
  }
}
