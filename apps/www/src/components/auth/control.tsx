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
