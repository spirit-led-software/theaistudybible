// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session?: import("@clerk/clerk-sdk-node").User;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
