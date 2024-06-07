import { Show, type JSXElement } from 'solid-js';
import { useAuth, useClerk } from '~/hooks/clerk';

export type SignedInProps = {
  children: JSXElement;
};

export default function SignedIn(props: SignedInProps) {
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const loaded = () => clerk()?.loaded ?? false;

  return <Show when={loaded() && isSignedIn()}>{props.children}</Show>;
}
