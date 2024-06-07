import type { UserButtonProps } from '@clerk/clerk-js/dist/types/ui/types';
import { onCleanup, onMount } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export default function UserButton(props: UserButtonProps) {
  const clerk = useClerk();
  let divRef: HTMLDivElement | undefined;

  onMount(() => {
    if (divRef) {
      clerk()?.mountUserButton(divRef, props);
    }
  });
  onCleanup(() => {
    if (divRef) {
      clerk()?.unmountUserButton(divRef);
    }
  });

  return <div id="clerk-user-button" ref={divRef} />;
}
