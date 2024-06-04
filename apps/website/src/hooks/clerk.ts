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
  const clerk = useContext(ClerkContext);
  if (!clerk) {
    throw new Error('useAuth must be used within a ClerkProvider');
  }

  return {
    getToken: () => {
      let getToken = clerk().session?.getToken;
      if (!getToken) {
        getToken = () => Promise.reject(new Error('Not signed in'));
      }
      return getToken;
    },
    userId: () => clerk().session?.user?.id,
    isSignedIn: () => !!clerk().session
  };
}

export function useUser() {
  const clerk = useContext(ClerkContext);
  if (!clerk) {
    throw new Error('useUser must be used within a ClerkProvider');
  }

  return {
    user: () => clerk().user,
    isSignedIn: () => !!clerk().user
  };
}
