import type { Message as AIMessage } from 'ai/solid';
import Icon from '~/components/branding/icon';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Markdown } from '~/components/ui/markdown';
import { useUser } from '~/hooks/clerk';

export const Message = (props: { message: AIMessage }) => {
  const { user } = useUser();

  return (
    <div class="flex w-full place-items-center space-x-2 p-2">
      {props.message.role === 'user' ? (
        <Avatar>
          <AvatarImage src={user()!.imageUrl!} />
          <AvatarFallback>{user()?.fullName}</AvatarFallback>
        </Avatar>
      ) : (
        <div class="flex h-10 w-10 flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2">
          <Icon width={50} height={50} class="flex-shrink-0" />
        </div>
      )}
      <Markdown>{props.message.content}</Markdown>
    </div>
  );
};
