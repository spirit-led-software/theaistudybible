import { useAuth } from '@/www/contexts/auth';
import type { JSX } from 'solid-js';

export const AuthLoaded = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded } = useAuth();
  return <>{isLoaded() ? props.children : props.fallback}</>;
};

export const AuthLoading = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded } = useAuth();
  return <>{!isLoaded() ? props.children : props.fallback}</>;
};

export const SignedIn = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded, isSignedIn } = useAuth();
  return <>{isLoaded() && isSignedIn() ? props.children : props.fallback}</>;
};

export const SignedOut = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded, isSignedIn } = useAuth();
  return <>{isLoaded() && !isSignedIn() ? props.children : props.fallback}</>;
};
