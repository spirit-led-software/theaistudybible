import { BellRing } from 'lucide-solid';
import { Bell } from 'lucide-solid';
import { Bookmark } from 'lucide-solid';
import { createSignal, onMount } from 'solid-js';
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
  const { isSignedIn } = useAuth();
  const [showPrompt, setShowPrompt] = createSignal(false);

  onMount(async () => {
    // Only show for signed-in users
    if (!isSignedIn()) return;

    // Check if notifications are supported
    if (!('Notification' in window)) return;

    // Don't show prompt if permission was already granted or denied
    if (Notification.permission !== 'default') return;

    // Check if we've shown the prompt before
    const hasShownPrompt = localStorage.getItem(NOTIFICATION_PROMPT_SHOWN_KEY);
    if (hasShownPrompt) return;

    // Wait a bit before showing the prompt to not overwhelm the user immediately
    setTimeout(() => setShowPrompt(true), 3000);
  });

  const handleClose = () => {
    setShowPrompt(false);
    // Remember that we've shown the prompt
    localStorage.setItem(NOTIFICATION_PROMPT_SHOWN_KEY, 'true');
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

        <div class='py-4'>
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
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Maybe Later
          </Button>
          <PushNotificationToggle onSuccess={handleClose} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
