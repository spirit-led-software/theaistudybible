import type { JSX } from 'solid-js';
import { useAuth } from '~/hooks/clerk';

export type SignedOutProps = {
  children: JSX.Element;
};

export default function SignedOut(props: SignedOutProps) {
  const { isSignedIn } = useAuth();
  return !isSignedIn ? props.children : null;
}
