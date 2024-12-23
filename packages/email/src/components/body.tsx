import { Body as BodyBase } from '@react-email/components';
import { cn } from '../lib/utils';

export type BodyProps = React.ComponentProps<typeof BodyBase>;

export const Body = ({ children, className, ...props }: BodyProps) => {
  return (
    <BodyBase
      className={cn('whitespace-pre-wrap bg-background font-inter text-foreground', className)}
      {...props}
    >
      {children}
    </BodyBase>
  );
};
