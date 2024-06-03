import { env } from '$env/dynamic/public';
import { Clerk } from '@clerk/clerk-js';

export function useClerk() {
  const clerk = $state<Clerk>(new Clerk(env.PUBLIC_CLERK_PUBLISHABLE_KEY!, {}));

  return {
    get clerk() {
      return clerk;
    }
  };
}

export function useAuth() {
  const { clerk } = useClerk();

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
  const { clerk } = useClerk();

  return {
    get user() {
      return clerk.user;
    },
    get isSignedIn() {
      return !!clerk.user;
    }
  };
}
