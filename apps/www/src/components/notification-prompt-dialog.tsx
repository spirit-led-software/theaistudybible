import { makePersisted } from '@solid-primitives/storage';
import { BellRing } from 'lucide-solid';
import { Bell } from 'lucide-solid';
import { Bookmark } from 'lucide-solid';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { useAuth } from '../contexts/auth';
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

export function NotificationPromptDialog() {
  const { isLoaded, isSignedIn } = useAuth();

  const [isSupported, setIsSupported] = createSignal(false);
  const [hasShownPrompt, setHasShownPrompt] = makePersisted(createSignal(false), {
    name: NOTIFICATION_PROMPT_SHOWN_KEY,
  });
  const [showPrompt, setShowPrompt] = createSignal(false);

  onMount(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    setIsSupported(true);
  });

  createEffect(() => {
    if (!isLoaded() || !isSignedIn()) return;
    if (!isSupported()) return;
    if (hasShownPrompt()) return;
    const timeout = setTimeout(() => setShowPrompt(true), 10000);
    onCleanup(() => clearTimeout(timeout));
  });

  const handleClose = () => {
    setShowPrompt(false);
    setHasShownPrompt(true);
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
              Get instant updates about new messages
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

        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
