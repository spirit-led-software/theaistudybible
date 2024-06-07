import type { SignInProps } from '@clerk/clerk-js/dist/types/ui/types';
import { createEffect, onCleanup } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export default function SignIn(props: SignInProps) {
  const clerk = useClerk();
  let divRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (divRef) {
      clerk()?.mountSignIn(divRef, props);
    }
  });
  onCleanup(() => {
    if (divRef) {
      clerk()?.unmountSignIn(divRef);
    }
  });

  return <div id="clerk-sign-in" ref={divRef} />;
}
