import { allChatModels, defaultChatModel } from '@/ai/models';
import { Button } from '@/www/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { useChatStore } from '@/www/contexts/chat';
import { useAuth } from '@/www/hooks/use-auth';
import { useSubscription } from '@/www/hooks/use-pro-subscription';
import { cn } from '@/www/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Anthropic, DeepSeek, Google, Meta, Mistral, OpenAI } from '../ui/brand-icons';

export const SelectModelButton = () => {
  const { modelId, setModelId } = useChatStore((s) => ({
    modelId: s.modelId,
    setModelId: s.setModelId,
  }));
  const { isActive } = useSubscription();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const selectedModel = useMemo(() => {
    const model = allChatModels.find((m) => m.id === modelId?.split(':')[1]);
    return model ?? defaultChatModel;
  }, [modelId]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='outline' size='icon' className='size-10 rounded-full p-2'>
          <ProviderIcon provider={selectedModel.provider} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='flex w-52 flex-col items-start overflow-hidden p-0'>
        {!isActive && !isAdmin && (
          <div className='mb-1 w-full rounded-lg rounded-b-none bg-gradient-to-r from-primary/10 to-accent/10 p-3 shadow-sm dark:border-primary/30'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <div className='rounded-full bg-gradient-to-r from-primary to-accent p-1.5'>
                  <Lock className='size-3 text-primary-foreground' />
                </div>
                <span className='font-medium text-xs'>Unlock Advanced Models</span>
              </div>
              <Button
                size='sm'
                className='h-7 w-full border-none bg-primary text-primary-foreground text-xs hover:bg-primary/90'
                onClick={() => {
                  // @ts-ignore - '/pro' route is used throughout the app but not in the generated type
                  navigate({ to: '/pro' });
                  setOpen(false);
                }}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
        {allChatModels.map((model) => (
          <DropdownMenuItem
            key={`${model.host}:${model.id}`}
            className={cn(
              'h-fit w-full cursor-pointer justify-start rounded-none px-5 py-3',
              modelId === `${model.host}:${model.id}` && 'bg-accent/80',
            )}
            onClick={() => {
              setModelId(`${model.host}:${model.id}`);
              setOpen(false);
            }}
            disabled={model.tier === 'advanced' && !isActive && !isAdmin}
          >
            <div className='flex items-center gap-2'>
              <div className='size-6'>
                <ProviderIcon provider={model.provider} />
              </div>
              <div className='flex flex-col items-start text-start'>
                <span className='text-wrap'>{model.name}</span>
                <span className='text-muted-foreground text-xs'>
                  {model.tier === 'basic' ? 'Basic' : 'Advanced'}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ProviderIcon = ({ provider }: { provider: (typeof allChatModels)[number]['provider'] }) => {
  switch (provider) {
    case 'openai':
      return <OpenAI fill='hsl(var(--foreground))' className='size-full' />;
    case 'anthropic':
      return <Anthropic fill='hsl(var(--foreground))' className='size-full' />;
    case 'mistral':
      return <Mistral className='size-full' />;
    case 'meta':
      return <Meta fill='hsl(var(--foreground))' className='size-full' />;
    case 'deepseek':
      return <DeepSeek fill='hsl(var(--foreground))' className='size-full' />;
    case 'google':
      return <Google fill='hsl(var(--foreground))' monochrome className='size-full' />;
    default:
      return <OpenAI fill='hsl(var(--foreground))' className='size-full' />;
  }
};
