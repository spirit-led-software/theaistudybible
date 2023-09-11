export type FirebaseConfig = {
  projectId: string;
  privateKey: string;
  clientEmail: string;
};

export const config: FirebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
};

export default config;
