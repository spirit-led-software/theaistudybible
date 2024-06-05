import type { SignUpProps } from '@clerk/clerk-js/dist/types/ui/types';
import { onCleanup, onMount } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export default function SignUp(props: SignUpProps) {
  const clerk = useClerk();
  let divRef: HTMLDivElement | undefined;

  onMount(() => {
    if (divRef) {
      clerk()?.mountSignUp(divRef, props);
    }
  });
  onCleanup(() => {
    if (divRef) {
      clerk()?.unmountSignUp(divRef);
    }
  });

  return <div id="clerk-sign-up" ref={divRef} />;
}
