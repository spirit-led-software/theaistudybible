import type { Message as AIMessage } from 'ai/solid';
import Icon from '~/components/branding/icon';
import { Markdown } from '~/components/ui/markdown';
import { useUser } from '~/hooks/clerk';

export type MessageProps = {
  message: AIMessage;
};

export const Message = (props: MessageProps) => {
  const { user } = useUser();

  return (
    <div class="flex w-full space-x-4 py-2 pl-5">
      <div class="mt-2 flex h-full items-start">
        {props.message.role === 'user' ? (
          <img src={user()?.imageUrl} alt="Avatar" class="h-10 w-10 rounded-full" />
        ) : (
          <div class="flex h-10 w-10 flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2">
            <Icon width={50} height={50} class="flex-shrink-0" />
          </div>
        )}
      </div>
      <Markdown>{props.message.content}</Markdown>
    </div>
  );
};
