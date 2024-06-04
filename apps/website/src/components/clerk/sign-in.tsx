import type { SignInProps } from '@clerk/clerk-js/dist/types/ui/types';
import { onMount } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export default function SignInButton(props: SignInProps) {
  const clerk = useClerk();
  let divRef: HTMLDivElement | undefined;

  onMount(() => {
    if (divRef) {
      clerk().mountSignIn(divRef, props);
    }
  });

  return <div id="clerk-sign-in-button" ref={divRef} />;
}
