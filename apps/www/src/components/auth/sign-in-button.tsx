import { A } from '@solidjs/router';
import { type ParentProps, splitProps } from 'solid-js';
import { Button, type ButtonProps } from '../ui/button';

export type SignInButtonProps = ParentProps<ButtonProps> & {
  redirectUrl?: string;
};

export const SignInButton = (props: SignInButtonProps) => {
  const [local, rest] = splitProps(props, ['children', 'redirectUrl']);

  return (
    <Button
      as={A}
      href={`/sign-in?redirectUrl=${encodeURIComponent(local.redirectUrl ?? '/')}`}
      {...rest}
    >
      {local.children ?? 'Sign In'}
    </Button>
  );
};
