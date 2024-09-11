import { Chrome, Firefox, Safari } from '@/www/components/ui/brand-icons';
import { buttonVariants } from '@/www/components/ui/button';
import { Spinner } from '@/www/components/ui/spinner';
import { GradientH1, H3, ListItem, OrderedList, P, Strong } from '@/www/components/ui/typography';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { EllipsisVertical, Globe, HousePlus, MonitorUp, Plus, Share } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createEffect, createSignal, For, Show } from 'solid-js';

export default function InstallPage() {
  const [isLoading, setIsLoading] = createSignal(true);
  const [userAgent, setUserAgent] = createSignal('');
  const [isStandalone, setIsStandalone] = createSignal(false);

  createEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setUserAgent(navigator.userAgent.toLowerCase());
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
      setIsLoading(false);
    }
  });

  const isIOS = () => /iphone|ipad|ipod/.test(userAgent());
  const isAndroid = () => /android/.test(userAgent());
  const isChrome = () => /chrome/.test(userAgent()) && !/edge|opr\//.test(userAgent());
  const isFirefox = () => /firefox/.test(userAgent());
  const isSafari = () => /safari/.test(userAgent()) && !/chrome|opera|edge/.test(userAgent());
  const isOpera = () => /opr\/|opera/.test(userAgent());
  const isEdge = () => /edg/.test(userAgent());
  const isMac = () => /macintosh|mac os x/.test(userAgent());
  const isWindows = () => /windows/.test(userAgent());

  return (
    <div class="mx-auto max-w-2xl p-4">
      <Show
        when={isStandalone()}
        fallback={
          <>
            <div class="mb-4">
              <GradientH1>Install as an App</GradientH1>
              <P>Follow these steps to install our Progressive Web App on your device:</P>
            </div>

            <Show when={isIOS() && isSafari()}>
              <InstallInstructions
                icon={<Safari class="mr-2 inline-block size-6" />}
                steps={[
                  <ListItem>
                    Tap the Share button (<Share class="inline-block size-4" />) in Safari's bottom
                    menu
                  </ListItem>,
                  <ListItem>
                    Scroll down and tap <Strong>Add to Home Screen</Strong>
                  </ListItem>,
                  <ListItem>
                    Tap <Strong>Add</Strong> in the top right corner
                  </ListItem>,
                ]}
              />
            </Show>

            <Show when={isAndroid() && isChrome()}>
              <InstallInstructions
                icon={<Chrome class="mr-2 inline-block size-6" />}
                steps={[
                  <ListItem>
                    Tap the menu icon (<EllipsisVertical class="inline-block size-4" />) in the top
                    right
                  </ListItem>,
                  <ListItem>
                    Tap <Strong>Add to Home screen</Strong>
                  </ListItem>,
                  <ListItem>
                    Tap <Strong>Add</Strong> on the popup
                  </ListItem>,
                ]}
              />
            </Show>

            <Show when={isChrome() && (isMac() || isWindows())}>
              <InstallInstructions
                icon={<Chrome class="mr-2 inline-block size-6" />}
                steps={[
                  <ListItem>
                    Click the install icon in the address bar (
                    <MonitorUp class="inline-block size-4" />)
                  </ListItem>,
                  <ListItem>
                    Click <Strong>Install</Strong> in the popup
                  </ListItem>,
                ]}
              />
            </Show>

            <Show when={isFirefox() && (isMac() || isWindows())}>
              <InstallInstructions
                icon={<Firefox class="mr-2 inline-block size-6" />}
                steps={[
                  <ListItem>
                    Click the install icon in the address bar (
                    <HousePlus class="inline-block size-4" />)
                  </ListItem>,
                  <ListItem>
                    Click <Strong>Install</Strong> in the popup
                  </ListItem>,
                ]}
              />
            </Show>

            <Show when={isEdge() && (isMac() || isWindows())}>
              <InstallInstructions
                icon={<Globe class="mr-2 inline-block size-6" />}
                steps={[
                  <ListItem>
                    Click the install icon in the address bar (<Plus class="inline-block size-4" />)
                    or (<Globe class="inline-block size-4" />)
                  </ListItem>,
                  <ListItem>
                    Click <Strong>Install</Strong> in the popup
                  </ListItem>,
                ]}
              />
            </Show>

            <Show when={isOpera() && (isMac() || isWindows())}>
              <InstallInstructions
                icon={<Globe class="mr-2 inline-block size-6" />}
                steps={[
                  <ListItem>
                    Click the install icon in the address bar (
                    <MonitorUp class="inline-block size-4" />)
                  </ListItem>,
                  <ListItem>
                    Click <Strong>Install</Strong> in the popup
                  </ListItem>,
                ]}
              />
            </Show>

            <Show when={isLoading()}>
              <div class="rounded-lg bg-gray-100 p-4">
                <H3 class="mb-2 text-xl font-bold">
                  <Spinner class="mr-2 inline-block size-4" />
                  Loading...
                </H3>
                <p>Please wait while we check your browser for installation support.</p>
              </div>
            </Show>

            <Show
              when={
                !isIOS() &&
                !isAndroid() &&
                !isChrome() &&
                !isFirefox() &&
                !isEdge() &&
                !isOpera() &&
                !isLoading()
              }
            >
              <div class="rounded-lg bg-yellow-100 p-4">
                <h2 class="mb-2 text-xl font-bold">Unsupported Browser</h2>
                <p>
                  Your current browser may not support PWA installation. Try using a modern browser
                  like Chrome, Firefox, or Edge for the best experience.
                </p>
              </div>
            </Show>

            <div class="mt-8 rounded-lg bg-blue-100 p-4">
              <H3>Need Help?</H3>
              <P>
                If you're having trouble installing the PWA, please make sure you're using the
                latest version of your browser. If you still need assistance, don't hesitate to
                <A
                  class={cn(buttonVariants({ variant: 'link' }), 'inline-block w-fit px-0')}
                  href="mailto:support@theaistudybible.com"
                >
                  contact our support team
                </A>
                .
              </P>
            </div>
          </>
        }
      >
        <div class="rounded-lg bg-green-100 p-4 text-green-800">
          <h2 class="mb-2 text-xl font-bold">You've already installed the PWA!</h2>
          <p>You're currently using the app in standalone mode. Enjoy!</p>
        </div>
      </Show>
    </div>
  );
}

function InstallInstructions(props: { icon: JSX.Element; steps: (string | JSX.Element)[] }) {
  return (
    <div class="mb-6 rounded-lg bg-gray-100 p-4">
      <H3>
        {props.icon}
        Installation Steps
      </H3>
      <OrderedList>
        <For each={props.steps}>
          {(step) => (
            <Show when={typeof step === 'string'} fallback={step}>
              <li class="mb-1">{step}</li>
            </Show>
          )}
        </For>
      </OrderedList>
    </div>
  );
}