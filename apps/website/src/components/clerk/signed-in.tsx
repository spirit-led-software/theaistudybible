import { Show, type JSXElement } from 'solid-js';
import { useAuth } from '~/hooks/clerk';

export type SignedInProps = {
  children: JSXElement;
};

export default function SignedIn(props: SignedInProps) {
  const { isSignedIn } = useAuth();

  return <Show when={isSignedIn()}>{props.children}</Show>;
}
