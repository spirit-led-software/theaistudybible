import { Clerk } from '@clerk/clerk-js';
import { getContext } from 'svelte';

export function useClerk() {
  return getContext('$$_clerk') as Clerk;
}

export function useAuth() {
  const clerk = useClerk();

  return {
    get userId() {
      return clerk.user?.id;
    },
    get getToken() {
      let getToken = clerk.session?.getToken;
      if (!getToken) {
        getToken = () => Promise.reject(new Error('Not signed in'));
      }
      return getToken;
    }
  };
}

export function useUser() {
  const clerk = useClerk();

  return {
    get user() {
      return clerk.user;
    },
    get isSignedIn() {
      return !!clerk.user;
    }
  };
}
