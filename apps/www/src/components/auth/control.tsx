import { useAuth } from '@/www/contexts/auth';
import { type JSX, Show } from 'solid-js';

export const AuthLoaded = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded } = useAuth();
  return (
    <Show when={isLoaded()} fallback={props.fallback}>
      {props.children}
    </Show>
  );
};

export const AuthLoading = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded } = useAuth();
  return (
    <Show when={!isLoaded()} fallback={props.fallback}>
      {props.children}
    </Show>
  );
};

export const SignedIn = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <Show when={isLoaded() && isSignedIn()} fallback={props.fallback}>
      {props.children}
    </Show>
  );
};

export const SignedOut = (props: { children: JSX.Element; fallback?: JSX.Element }) => {
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <Show when={isLoaded() && !isSignedIn()} fallback={props.fallback}>
      {props.children}
    </Show>
  );
};

export const Protected = (props: {
  children: JSX.Element;
  loadingFallback?: JSX.Element;
  signedOutFallback?: JSX.Element;
}) => {
  return (
    <AuthLoaded fallback={props.loadingFallback}>
      <SignedIn fallback={props.signedOutFallback}>{props.children}</SignedIn>
    </AuthLoaded>
  );
};

export const Anonymous = (props: {
  children: JSX.Element;
  loadingFallback?: JSX.Element;
  signedInFallback?: JSX.Element;
}) => {
  return (
    <AuthLoaded fallback={props.loadingFallback}>
      <SignedOut fallback={props.signedInFallback}>{props.children}</SignedOut>
    </AuthLoaded>
  );
};
