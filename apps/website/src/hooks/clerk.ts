import { useContext } from 'solid-js';
import { ClerkContext } from '~/components/providers/clerk';

export function useClerk() {
  const clerk = useContext(ClerkContext);
  if (!clerk) {
    throw new Error('useClerk must be used within a ClerkProvider');
  }
  return clerk;
}

export function useAuth() {
  const clerk = useClerk();
  return {
    get getToken() {
      let getToken = clerk().session?.getToken;
      if (!getToken) {
        getToken = () => Promise.reject(new Error('Not signed in'));
      }
      return getToken;
    },
    userId: clerk().session?.user?.id,
    isSignedIn: !!clerk().session?.user?.id
  };
}

export function useUser() {
  const clerk = useClerk();
  return {
    get user() {
      return clerk().user;
    },
    get isSignedIn() {
      return !!clerk().user;
    }
  };
}
