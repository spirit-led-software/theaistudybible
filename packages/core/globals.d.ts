import '../../sst-env';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Make everything else undefined
      [key: string]: undefined;
    }
  }
  interface CustomJwtSessionClaims {
    metadata: {
      roles?: string[];
      bibleTranslation?: string;
      stripeCustomerId?: string;
    };
  }
}
