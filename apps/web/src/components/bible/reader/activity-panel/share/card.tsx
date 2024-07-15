import { writeClipboard } from '@solid-primitives/clipboard';
import { createSocialShare } from '@solid-primitives/share';
import { Check, Copy } from 'lucide-solid';
import { Match, Switch } from 'solid-js';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { TextField, TextFieldTextArea } from '~/components/ui/text-field';
import { showToast } from '~/components/ui/toast';
import { useBibleReaderStore } from '~/contexts/bible-reader';
import { EmailShareButton, FacebookShareButton, XShareButton } from './buttons';

export const ShareCard = () => {
  const [brStore] = useBibleReaderStore();

  let shareInputRef: HTMLTextAreaElement | undefined;

  const [share] = createSocialShare(() => ({
    title: `${brStore.selectedTitle} - ${brStore.selectedText}`,
    quote: `${brStore.selectedText} (${brStore.selectedTitle})`,
    description: 'Shared verse from The AI Study Bible.',
    url: window.location.href,
    hashtags: 'theaistudybible,ai,studybible,bible,verse,scripture,scriptures'
  }));

  return (
    <Card class="w-full">
      <CardHeader>
        <CardTitle>Share</CardTitle>
      </CardHeader>
      <CardContent>
        <TextField>
          <TextFieldTextArea
            ref={shareInputRef}
            value={brStore.selectedText}
            class="w-full resize-none"
            autoResize={true}
          />
        </TextField>
      </CardContent>
      <CardFooter class="justify-end space-x-2">
        <DrawerClose as={Button} variant="outline">
          Close
        </DrawerClose>
        <Button
          onClick={() => {
            if (shareInputRef) {
              writeClipboard([
                new ClipboardItem({
                  'text/plain': new Blob([shareInputRef.value], { type: 'text/plain' })
                })
              ]);
              showToast({
                title: (
                  <div class="flex items-center gap-2">
                    <Check />
                    Copied to clipboard
                  </div>
                )
              });
            }
          }}
        >
          <Copy />
        </Button>
        <Switch>
          <Match when={navigator.share}>
            <Button
              onClick={() => {
                navigator.share({
                  title: brStore.selectedTitle,
                  text: brStore.selectedText,
                  url: window.location.href
                });
              }}
            >
              Share
            </Button>
          </Match>
          <Match when={!navigator.share}>
            <XShareButton share={share} />
            <FacebookShareButton share={share} />
            <EmailShareButton share={share} />
          </Match>
        </Switch>
      </CardFooter>
    </Card>
  );
};
