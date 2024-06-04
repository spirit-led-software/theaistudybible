import type { SignUpProps } from '@clerk/clerk-js/dist/types/ui/types';
import { onMount } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export default function SignUpButton(props: SignUpProps) {
  const clerk = useClerk();
  let divRef: HTMLDivElement | undefined;

  onMount(() => {
    if (divRef) {
      clerk().mountSignUp(divRef, props);
    }
  });

  return <div id="clerk-sign-up-button" ref={divRef} />;
}
