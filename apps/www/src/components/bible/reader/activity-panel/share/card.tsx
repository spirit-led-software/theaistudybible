import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { DrawerClose } from '@/www/components/ui/drawer';
import { TextField, TextFieldTextArea } from '@/www/components/ui/text-field';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { writeClipboard } from '@solid-primitives/clipboard';
import { createSocialShare } from '@solid-primitives/share';
import { useLocation } from '@solidjs/router';
import { Copy } from 'lucide-solid';
import { Match, Switch } from 'solid-js';
import { toast } from 'solid-sonner';
import { EmailShareButton, FacebookShareButton, XShareButton } from './buttons';

export const ShareCard = () => {
  const [brStore] = useBibleReaderStore();
  const location = useLocation();

  let shareInputRef: HTMLTextAreaElement | undefined;

  const [share] = createSocialShare(() => ({
    title: `${brStore.selectedTitle} - ${brStore.selectedText}`,
    quote: `${brStore.selectedText} (${brStore.selectedTitle})`,
    description: 'Shared verse from The AI Study Bible.',
    url: `${import.meta.env.PUBLIC_WEBAPP_URL}${location.pathname}${location.search}`,
    hashtags: 'theaistudybible,ai,studybible,bible,verse,scripture,scriptures',
  }));

  return (
    <Card class='w-full'>
      <CardHeader>
        <CardTitle>Share</CardTitle>
      </CardHeader>
      <CardContent>
        <TextField>
          <TextFieldTextArea
            ref={shareInputRef}
            value={brStore.selectedText}
            class='w-full resize-none'
            autoResize={true}
          />
        </TextField>
      </CardContent>
      <CardFooter class='justify-end space-x-2'>
        <DrawerClose as={Button} variant='outline'>
          Close
        </DrawerClose>
        <Button
          onClick={() => {
            if (shareInputRef) {
              void writeClipboard([
                new ClipboardItem({
                  'text/plain': new Blob([shareInputRef.value], {
                    type: 'text/plain',
                  }),
                }),
              ]);
              toast.success('Copied to clipboard');
            }
          }}
        >
          <Copy />
        </Button>
        <Switch
          fallback={
            <Button variant='outline' disabled>
              Share
            </Button>
          }
        >
          <Match when={typeof navigator !== 'undefined' && 'share' in navigator}>
            <Button
              onClick={() =>
                navigator.share({
                  title: brStore.selectedTitle,
                  text: brStore.selectedText,
                  url: window.location.href,
                })
              }
            >
              Share
            </Button>
          </Match>
          <Match when={typeof navigator !== 'undefined' && !('share' in navigator)}>
            <XShareButton share={share} />
            <FacebookShareButton share={share} />
            <EmailShareButton share={share} />
          </Match>
        </Switch>
      </CardFooter>
    </Card>
  );
};
