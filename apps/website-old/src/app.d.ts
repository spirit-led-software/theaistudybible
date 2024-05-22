// See https://kit.svelte.dev/docs/types#app

import { UserInfo } from '@revelationsai/core/model/user';

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session?: string;
      user?: UserInfo;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
