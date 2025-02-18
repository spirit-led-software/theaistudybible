import { SESClient } from '@aws-sdk/client-ses';

let currentSES: SESClient | undefined;
export const ses = () => {
  if (!currentSES) {
    currentSES = new SESClient({});
  }
  return currentSES;
};
