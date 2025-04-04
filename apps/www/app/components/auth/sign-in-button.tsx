import { Link } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import { Button } from '../ui/button';

export type SignInButtonProps = ComponentProps<typeof Button> & {
  redirectUrl?: string;
};

export const SignInButton = ({ children, redirectUrl, ...rest }: SignInButtonProps) => {
  return (
    <Button asChild {...rest}>
      <Link to='/sign-in' search={{ redirectUrl }}>
        {children ?? 'Sign In'}
      </Link>
    </Button>
  );
};
