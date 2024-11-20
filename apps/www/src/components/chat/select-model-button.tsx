import { allModels, defaultModel } from '@/ai/models';
import { Button } from '@/www/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { useChatStore } from '@/www/contexts/chat';
import { cn } from '@/www/lib/utils';
import { For, Match, Switch, createMemo, createSignal } from 'solid-js';
import { Anthropic, Meta, Mistral, OpenAI } from '../ui/brand-icons';

export const SelectModelButton = () => {
  const [store, setStore] = useChatStore();

  const [open, setOpen] = createSignal(false);

  const selectedModel = createMemo(() => {
    const model = allModels.find((m) => m.id === store.modelId?.split(':')[1]);
    return model ?? defaultModel;
  });

  return (
    <Popover open={open()} onOpenChange={setOpen}>
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
        </Switch>
      </PopoverTrigger>
      <PopoverContent class='w-fit p-0'>
        <div class='flex flex-col items-start gap-1'>
          <For each={allModels}>
            {(model) => (
              <Button
                variant='ghost'
                class={cn(
                  'h-fit w-full justify-start px-5 py-3',
                  store.modelId === `${model.host}:${model.id}` && 'bg-accent',
                )}
                onClick={() => {
                  setStore('modelId', `${model.host}:${model.id}`);
                  setOpen(false);
                }}
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
                    </Switch>
                  </div>
                  <div class='flex flex-col items-start'>
                    <span>{model.name}</span>
                    <span class='text-muted-foreground text-xs'>
                      {model.tier === 'free' ? 'Basic' : 'Advanced'}
                    </span>
                  </div>
                </div>
              </Button>
            )}
          </For>
        </div>
      </PopoverContent>
    </Popover>
  );
};
