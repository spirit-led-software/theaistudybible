import { A } from '@solidjs/router';
import { type ParentProps, splitProps } from 'solid-js';
import { Button, type ButtonProps } from '../ui/button';

export const SignInButton = (props: ParentProps<ButtonProps>) => {
  const [local, rest] = splitProps(props, ['children']);

  return (
    <Button as={A} href='/sign-in' {...rest}>
      {local.children ?? 'Sign In'}
    </Button>
  );
};
