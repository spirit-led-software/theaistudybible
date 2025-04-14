import { List, ListItem } from '@/www/components/ui/typography';
import { useAuth } from '@/www/hooks/use-auth';
import { Bell, BellRing, Bookmark } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
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

const NOTIFICATION_PROMPT_SHOWN_KEY = 'notification-prompt-shown';
const NOTIFICATION_LAST_PROMPT_TIME_KEY = 'notification-last-prompt-time';
const NOTIFICATION_OPTED_OUT_KEY = 'notification-opted-out';
const REPROMPT_INTERVAL = 1 * 24 * 60 * 60 * 1000; // 1 day in milliseconds
const INITIAL_PROMPT_DELAY = 10000; // 10 seconds

export function NotificationPromptDialog() {
  const { isLoaded, isSignedIn } = useAuth();

  const [isSupported, setIsSupported] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useLocalStorage(NOTIFICATION_PROMPT_SHOWN_KEY, false);
  const [lastPromptTime, setLastPromptTime] = useLocalStorage<number | null>(
    NOTIFICATION_LAST_PROMPT_TIME_KEY,
    null,
  );
  const [hasOptedOut, setHasOptedOut] = useLocalStorage(NOTIFICATION_OPTED_OUT_KEY, false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    setIsSupported(true);
  }, []);

  // Handle showing the prompt
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!isSupported) return;
    if (hasOptedOut) return;

    const shouldPrompt = () => {
      if (!lastPromptTime) return true;
      return Date.now() - lastPromptTime >= REPROMPT_INTERVAL;
    };

    if (!shouldPrompt()) return;

    const timeout = setTimeout(
      () => {
        setShowPrompt(true);
        setLastPromptTime(Date.now());
      },
      hasShownPrompt ? 0 : INITIAL_PROMPT_DELAY,
    );

    return () => clearTimeout(timeout);
  }, [
    isLoaded,
    isSignedIn,
    isSupported,
    hasOptedOut,
    lastPromptTime,
    hasShownPrompt,
    setLastPromptTime,
  ]);

  const handleClose = useCallback(() => {
    setShowPrompt(false);
    setHasShownPrompt(true);
  }, [setHasShownPrompt]);

  const handleOptOut = useCallback(() => {
    setShowPrompt(false);
    setHasShownPrompt(true);
    setHasOptedOut(true);
  }, [setHasShownPrompt, setHasOptedOut]);

  return (
    <Dialog open={showPrompt} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stay Updated</DialogTitle>
          <DialogDescription>
            Enable notifications to stay informed about new messages, updates, and important events.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center gap-4'>
          <List>
            <ListItem className='flex items-center gap-2'>
              <Bell />
              Get instant updates about new devotions
            </ListItem>
            <ListItem className='flex items-center gap-2'>
              <Bookmark />
              Never miss important announcements
            </ListItem>
            <ListItem className='flex items-center gap-2'>
              <BellRing />
              Receive timely reminders
            </ListItem>
          </List>
          <PushNotificationToggle onSuccess={handleClose} />
        </div>

        <DialogFooter className='flex justify-end gap-2'>
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
