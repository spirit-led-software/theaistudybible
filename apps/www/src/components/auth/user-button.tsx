import { lucia } from '@/core/auth';
import { useAuth } from '@/www/contexts/auth';
import { cn } from '@/www/lib/utils';
import { requireAuth } from '@/www/server/utils/auth';
import { type ConfigColorMode, useColorMode } from '@kobalte/core';
import { A, action, redirect, useAction, useBeforeLeave } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { Bookmark, Highlighter, Laptop, LogOut, Moon, Notebook, Sun, User } from 'lucide-solid';
import { createSignal, splitProps } from 'solid-js';
import { toast } from 'solid-sonner';
import { Button, type ButtonProps } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
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

const signOutAction = action(async () => {
  'use server';
  const { session } = requireAuth();
  await lucia.sessions.invalidateSession(session.id);
  const cookie = lucia.cookies.createBlankSessionCookie();
  throw redirect('/', { headers: { 'Set-Cookie': cookie.serialize() } });
});

export type UserButtonProps = ButtonProps & {
  showName?: boolean;
};

export const UserButton = (_props: UserButtonProps) => {
  const [local, rest] = splitProps(_props, ['children', 'class', 'showName']);

  const signOut = useAction(signOutAction);

  const { isLoaded, isSignedIn, user, refetch } = useAuth();

  const { colorMode, setColorMode } = useColorMode();

  const [isOpen, setIsOpen] = createSignal(false);

  const handleSignOut = createMutation(() => ({
    mutationFn: () => Promise.resolve(signOut()),
    onSuccess: () => refetch(),
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  useBeforeLeave(() => setIsOpen(false));

  return (
    <>
      {isLoaded() && isSignedIn() && (
        <DropdownMenu open={isOpen()} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger
            as={Button}
            variant='ghost'
            size='icon'
            class={cn(
              'flex h-fit w-fit shrink-0 items-center gap-1 p-0',
              !local.showName && 'size-10 rounded-full',
              local.class,
            )}
            {...rest}
          >
            {local.children ?? (
              <>
                {local.showName && (user()?.firstName || user()?.lastName) && (
                  <div class='flex flex-wrap items-center gap-2'>
                    {user()?.firstName && <span>{user()?.firstName}</span>}
                    {user()?.lastName && <span>{user()?.lastName}</span>}
                  </div>
                )}
                <UserAvatar class={cn(!local.showName && 'size-full')} />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent class='w-[200px]'>
            <div class='flex flex-col gap-2 p-2'>
              <div class='mx-auto mb-2 flex flex-wrap items-center justify-center gap-4'>
                <UserAvatar />
                <div class='flex flex-wrap items-center justify-center gap-0.5 font-semibold text-muted-foreground'>
                  {user()?.firstName && <span class='inline'>{user()?.firstName}</span>}
                  {user()?.lastName && <span class='inline'>{user()?.lastName}</span>}
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuGroupLabel>Profile</DropdownMenuGroupLabel>
                <DropdownMenuItem as={A} href='/profile/highlights' class='flex items-center gap-2'>
                  <Highlighter size={18} /> Highlights
                </DropdownMenuItem>
                <DropdownMenuItem as={A} href='/profile/bookmarks' class='flex items-center gap-2'>
                  <Bookmark size={18} /> Bookmarks
                </DropdownMenuItem>
                <DropdownMenuItem as={A} href='/profile/notes' class='flex items-center gap-2'>
                  <Notebook size={18} /> Notes
                </DropdownMenuItem>
                <DropdownMenuItem as={A} href='/profile' class='flex items-center gap-2'>
                  <User size={18} /> Account
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={colorMode()}
                      onChange={(value) => setColorMode(value as ConfigColorMode)}
                    >
                      <DropdownMenuRadioItem value='light' class='flex items-center gap-2'>
                        <Sun size={18} /> Light
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='dark' class='flex items-center gap-2'>
                        <Moon size={18} /> Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='system' class='flex items-center gap-2'>
                        <Laptop size={18} /> System
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => handleSignOut.mutateAsync()}
                class='flex items-center gap-2'
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
