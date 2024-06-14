import { createSocialShare } from '@solid-primitives/share';
import { Copy } from 'lucide-solid';
import { Match, Switch } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { TextField, TextFieldTextArea } from '~/components/ui/text-field';
import { showToast } from '~/components/ui/toast';
import { P } from '~/components/ui/typography';
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
              navigator.clipboard.writeText(shareInputRef.value);
              showToast({
                title: <P>Copied to clipboard</P>
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
