import { useAuth } from '@/www/hooks/use-auth';
import { makePersisted } from '@solid-primitives/storage';
import { BellRing } from 'lucide-solid';
import { Bell } from 'lucide-solid';
import { Bookmark } from 'lucide-solid';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { PushNotificationToggle } from './push-notification-toggle';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { List, ListItem } from './ui/typography';

const NOTIFICATION_PROMPT_SHOWN_KEY = 'notification-prompt-shown';
const NOTIFICATION_LAST_PROMPT_TIME_KEY = 'notification-last-prompt-time';
const NOTIFICATION_OPTED_OUT_KEY = 'notification-opted-out';
const REPROMPT_INTERVAL = 1 * 24 * 60 * 60 * 1000; // 1 day in milliseconds
const INITIAL_PROMPT_DELAY = 10000; // 10 seconds

export function NotificationPromptDialog() {
  const { isLoaded, isSignedIn } = useAuth();

  const [isSupported, setIsSupported] = createSignal(false);
  const [hasShownPrompt, setHasShownPrompt] = makePersisted(createSignal(false), {
    name: NOTIFICATION_PROMPT_SHOWN_KEY,
  });
  const [lastPromptTime, setLastPromptTime] = makePersisted(createSignal<number | null>(null), {
    name: NOTIFICATION_LAST_PROMPT_TIME_KEY,
  });
  const [hasOptedOut, setHasOptedOut] = makePersisted(createSignal(false), {
    name: NOTIFICATION_OPTED_OUT_KEY,
  });
  const [showPrompt, setShowPrompt] = createSignal(false);

  onMount(() => {
    if (isServer) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    setIsSupported(true);
  });

  createEffect(() => {
    if (!isLoaded() || !isSignedIn()) return;
    if (!isSupported()) return;
    if (hasOptedOut()) return;

    const shouldPrompt = () => {
      const lastTime = lastPromptTime();
      if (!lastTime) return true;
      return Date.now() - lastTime >= REPROMPT_INTERVAL;
    };

    if (!shouldPrompt()) return;

    const timeout = setTimeout(
      () => {
        setShowPrompt(true);
        setLastPromptTime(Date.now());
      },
      hasShownPrompt() ? 0 : INITIAL_PROMPT_DELAY,
    );

    onCleanup(() => clearTimeout(timeout));
  });

  const handleClose = () => {
    setShowPrompt(false);
    setHasShownPrompt(true);
  };

  const handleOptOut = () => {
    setShowPrompt(false);
    setHasShownPrompt(true);
    setHasOptedOut(true);
  };

  return (
    <Dialog open={showPrompt()} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stay Updated</DialogTitle>
          <DialogDescription>
            Enable notifications to stay informed about new messages, updates, and important events.
          </DialogDescription>
        </DialogHeader>

        <div class='flex flex-col items-center gap-4'>
          <List>
            <ListItem class='flex items-center gap-2'>
              <Bell />
              Get instant updates about new devotions
            </ListItem>
            <ListItem class='flex items-center gap-2'>
              <Bookmark />
              Never miss important announcements
            </ListItem>
            <ListItem class='flex items-center gap-2'>
              <BellRing />
              Receive timely reminders
            </ListItem>
          </List>
          <PushNotificationToggle onSuccess={handleClose} />
        </div>

        <DialogFooter class='flex justify-end gap-2'>
          <Button variant='ghost' onClick={handleOptOut}>
            Don't Ask Again
          </Button>
          <Button variant='outline' onClick={handleClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
