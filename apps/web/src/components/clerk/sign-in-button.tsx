import { Show } from 'solid-js';
import { useClerk } from '~/hooks/clerk';
import { Button, ButtonProps } from '../ui/button';

export default function SignInButton(props: Omit<ButtonProps, 'as' | 'children'>) {
  const clerk = useClerk();
  const loaded = () => clerk()?.loaded ?? false;
  const onClick = () => {
    clerk()?.openSignIn();
  };
  return (
    <Show when={loaded()}>
      <Button {...props} onClick={onClick}>
        Sign In
      </Button>
    </Show>
  );
}
