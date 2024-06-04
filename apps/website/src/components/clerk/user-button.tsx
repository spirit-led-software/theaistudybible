import type { UserButtonProps } from '@clerk/clerk-js/dist/types/ui/types';
import { onMount } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export default function UserButton(props: UserButtonProps) {
  const clerk = useClerk();
  let divRef: HTMLDivElement | undefined;

  onMount(() => {
    if (divRef) {
      clerk().mountUserButton(divRef, props);
    }
  });

  return <div id="clerk-user-button" ref={divRef} />;
}
