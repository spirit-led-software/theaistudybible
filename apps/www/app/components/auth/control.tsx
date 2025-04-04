import { useAuth } from '@/www/hooks/use-auth';

export const AuthLoaded = (props: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  const { isLoaded } = useAuth();
  return <>{isLoaded ? props.children : props.fallback}</>;
};

export const AuthLoading = (props: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  const { isLoaded } = useAuth();
  return <>{!isLoaded ? props.children : props.fallback}</>;
};

export const SignedIn = (props: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();
  return <>{isLoaded && isSignedIn ? props.children : props.fallback}</>;
};

export const SignedOut = (props: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();
  return <>{isLoaded && !isSignedIn ? props.children : props.fallback}</>;
};
