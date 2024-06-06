import { Show, type JSXElement } from 'solid-js';
import { useAuth, useClerk } from '~/hooks/clerk';

export type SignedOutProps = {
  children: JSXElement;
};

export default function SignedOut(props: SignedOutProps) {
  const clerk = useClerk();
  const { isSignedIn } = useAuth();

  const loaded = () => clerk()?.loaded ?? false;

  return <Show when={loaded() && !isSignedIn()}>{props.children}</Show>;
}
