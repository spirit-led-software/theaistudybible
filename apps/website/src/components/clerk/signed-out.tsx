import { Show, type JSXElement } from 'solid-js';
import { useAuth } from '~/hooks/clerk';

export type SignedOutProps = {
  children: JSXElement;
};

export default function SignedOut(props: SignedOutProps) {
  const { isSignedIn } = useAuth();

  return <Show when={!isSignedIn()}>{props.children}</Show>;
}
