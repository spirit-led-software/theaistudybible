import { lucia } from '@/core/auth';
import { type Theme, useTheme } from '@/www/contexts/theme';
import { useAuth } from '@/www/hooks/use-auth';
import { useBeforeLeave } from '@/www/hooks/use-before-leave';
import { cn } from '@/www/lib/utils';
import { requireAuthMiddleware } from '@/www/server/middleware/auth';
import { useMutation } from '@tanstack/react-query';
import { Link, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Bookmark, Highlighter, Laptop, LogOut, Moon, Sun, User } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { UserAvatar } from './user-avatar';

const signOut = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    await lucia.sessions.invalidateSession(context.session.id);
    const cookie = lucia.cookies.createBlankSessionCookie();
    throw redirect({ to: '/', headers: { 'Set-Cookie': cookie.serialize() } });
  });

export type UserButtonProps = ComponentProps<typeof Button> & {
  showName?: boolean;
};

export const UserButton = ({ children, className, showName, ...props }: UserButtonProps) => {
  const { isLoaded, isSignedIn, user, refetch } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = useMutation({
    mutationFn: () => Promise.resolve(signOut()),
    onSuccess: () => refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useBeforeLeave(() => setIsOpen(false));

  return (
    <>
      {isLoaded && isSignedIn && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'flex h-fit w-fit shrink-0 items-center gap-1 p-0',
                !showName && 'size-10 rounded-full',
                className,
              )}
              {...props}
            >
              {children ?? (
                <>
                  {showName && (user?.firstName || user?.lastName) && (
                    <div className='flex flex-wrap items-center gap-2'>
                      {user?.firstName && <span>{user?.firstName}</span>}
                      {user?.lastName && <span>{user?.lastName}</span>}
                    </div>
                  )}
                  <UserAvatar className={cn(!showName && 'size-full')} />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-[200px]'>
            <div className='flex flex-col gap-2 p-2'>
              <div className='mx-auto mb-2 flex flex-wrap items-center justify-center gap-4'>
                <UserAvatar />
                <div className='flex flex-wrap items-center justify-center gap-0.5 font-semibold text-muted-foreground'>
                  {user?.firstName && <span className='inline'>{user?.firstName}</span>}
                  {user?.lastName && <span className='inline'>{user?.lastName}</span>}
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>Profile</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to='/profile/highlights'>
                    <Highlighter size={18} /> Highlights
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/profile/bookmarks'>
                    <Bookmark size={18} /> Bookmarks
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/profile'>
                    <User size={18} /> Account
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={theme}
                      onValueChange={(value) => setTheme(value as Theme)}
                    >
                      <DropdownMenuRadioItem value='light' className='flex items-center gap-2'>
                        <Sun size={18} /> Light
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='dark' className='flex items-center gap-2'>
                        <Moon size={18} /> Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='system' className='flex items-center gap-2'>
                        <Laptop size={18} /> System
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => handleSignOut.mutateAsync()}
                className='flex items-center gap-2'
              >
                <LogOut size={18} /> Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};
