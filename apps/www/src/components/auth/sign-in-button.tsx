import { useNavigate } from '@solidjs/router';
import { type ParentProps, splitProps } from 'solid-js';
import { Button, type ButtonProps } from '../ui/button';

export const SignInButton = (props: ParentProps<ButtonProps>) => {
  const [local, rest] = splitProps(props, ['children']);

  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate('/sign-in')} {...rest}>
      {local.children ?? 'Sign In'}
    </Button>
  );
};
