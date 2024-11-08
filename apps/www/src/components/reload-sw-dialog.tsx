import { useRegisterSW } from 'virtual:pwa-register/solid';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export const ReloadSwDialog = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setNeedRefresh(false);
    // Remind the user every hour
    setTimeout(
      () => {
        setNeedRefresh(true);
      },
      1000 * 60 * 60,
    );
  };

  return (
    <Dialog open={needRefresh()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New version available</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          A new version of the app is available. Would you like to update?
        </DialogDescription>
        <DialogFooter>
          <Button variant='outline' onClick={close}>
            Cancel
          </Button>
          <Button onClick={() => updateServiceWorker(true)}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
