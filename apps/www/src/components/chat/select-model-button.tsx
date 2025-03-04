import { allChatModels, defaultChatModel } from '@/ai/models';
import { Button } from '@/www/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { useChatStore } from '@/www/contexts/chat';
import { useAuth } from '@/www/hooks/use-auth';
import { useSubscription } from '@/www/hooks/use-pro-subscription';
import { cn } from '@/www/lib/utils';
import { useNavigate } from '@solidjs/router';
import { Lock } from 'lucide-solid';
import { For, Match, Show, Switch, createMemo, createSignal } from 'solid-js';
import { Anthropic, DeepSeek, Google, Meta, Mistral, OpenAI } from '../ui/brand-icons';

export const SelectModelButton = () => {
  const [store, setStore] = useChatStore();
  const { isActive } = useSubscription();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = createSignal(false);

  const selectedModel = createMemo(() => {
    const model = allChatModels.find((m) => m.id === store.modelId?.split(':')[1]);
    return model ?? defaultChatModel;
  });

  return (
    <Popover open={open()} onOpenChange={setOpen} placement='top-start'>
      <PopoverTrigger
        as={Button}
        type='button'
        variant='outline'
        size='icon'
        class='size-10 rounded-full p-2'
      >
        <Switch fallback={<OpenAI fill='hsl(var(--foreground))' class='size-full' />}>
          <Match when={selectedModel().provider === 'openai'}>
            <OpenAI fill='hsl(var(--foreground))' class='size-full' />
          </Match>
          <Match when={selectedModel().provider === 'anthropic'}>
            <Anthropic fill='hsl(var(--foreground))' class='size-full' />
          </Match>
          <Match when={selectedModel().provider === 'mistral'}>
            <Mistral class='size-full' />
          </Match>
          <Match when={selectedModel().provider === 'meta'}>
            <Meta fill='hsl(var(--foreground))' class='size-full' />
          </Match>
          <Match when={selectedModel().provider === 'deepseek'}>
            <DeepSeek fill='hsl(var(--foreground))' class='size-full' />
          </Match>
          <Match when={selectedModel().provider === 'google'}>
            <Google fill='hsl(var(--foreground))' monochrome class='size-full' />
          </Match>
        </Switch>
      </PopoverTrigger>
      <PopoverContent class='flex w-52 flex-col items-start overflow-hidden p-0'>
        <Show when={!isActive() && !isAdmin()}>
          <div class='mb-1 w-full rounded-lg rounded-b-none bg-gradient-to-r from-primary/10 to-accent/10 p-3 shadow-sm dark:border-primary/30'>
            <div class='flex flex-col gap-2'>
              <div class='flex items-center gap-2'>
                <div class='rounded-full bg-gradient-to-r from-primary to-accent p-1.5'>
                  <Lock class='size-3 text-primary-foreground' />
                </div>
                <span class='font-medium text-xs'>Unlock Advanced Models</span>
              </div>
              <Button
                size='sm'
                class='h-7 w-full border-none bg-primary text-primary-foreground text-xs hover:bg-primary/90'
                onClick={() => {
                  navigate('/pro');
                  setOpen(false);
                }}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </Show>
        <For each={allChatModels}>
          {(model) => (
            <Button
              variant='ghost'
              class={cn(
                'h-fit w-full justify-start rounded-none px-5 py-3',
                store.modelId === `${model.host}:${model.id}` && 'bg-accent/80',
              )}
              onClick={() => {
                setStore('modelId', `${model.host}:${model.id}`);
                setOpen(false);
              }}
              disabled={model.tier === 'advanced' && !isActive() && !isAdmin()}
            >
              <div class='flex items-center gap-2'>
                <div class='size-6'>
                  <Switch>
                    <Match when={model.provider === 'openai'}>
                      <OpenAI fill='hsl(var(--foreground))' class='size-full' />
                    </Match>
                    <Match when={model.provider === 'anthropic'}>
                      <Anthropic fill='hsl(var(--foreground))' class='size-full' />
                    </Match>
                    <Match when={model.provider === 'mistral'}>
                      <Mistral class='size-full' />
                    </Match>
                    <Match when={model.provider === 'meta'}>
                      <Meta fill='hsl(var(--foreground))' class='size-full' />
                    </Match>
                    <Match when={model.provider === 'deepseek'}>
                      <DeepSeek fill='hsl(var(--foreground))' class='size-full' />
                    </Match>
                    <Match when={model.provider === 'google'}>
                      <Google fill='hsl(var(--foreground))' monochrome class='size-full' />
                    </Match>
                  </Switch>
                </div>
                <div class='flex flex-col items-start text-start'>
                  <span class='text-wrap'>{model.name}</span>
                  <span class='text-muted-foreground text-xs'>
                    {model.tier === 'basic' ? 'Basic' : 'Advanced'}
                  </span>
                </div>
              </div>
            </Button>
          )}
        </For>
      </PopoverContent>
    </Popover>
  );
};
