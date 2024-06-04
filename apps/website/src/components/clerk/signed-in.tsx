import type { JSX } from 'solid-js';
import { useAuth } from '~/hooks/clerk';

export type SignedInProps = {
  children: JSX.Element;
};

export default function SignedIn(props: SignedInProps) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? props.children : null;
}
