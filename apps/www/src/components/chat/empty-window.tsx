import { useChat } from '@/www/contexts/chat';
import { Book, Globe, Heart, Image, Lightbulb, Wrench } from 'lucide-solid';
import { For } from 'solid-js';
import { Button } from '../ui/button';
import { GradientH3 } from '../ui/typography';

export type EmptyWindowProps = {
  additionalContext?: string;
};

export const EmptyWindow = (props: EmptyWindowProps) => {
  const { append } = useChat();

  const questions = [
    {
      icon: Lightbulb,
      text: 'Who is Jesus Christ?',
      query: 'Who is Jesus Christ and why is He significant?',
    },
    { icon: Wrench, text: 'What tools can you use?', query: 'What tools do you have access to?' },
    {
      icon: Heart,
      text: 'How to grow in faith?',
      query: 'What are some practical ways to grow in Christian faith?',
    },
    {
      icon: Globe,
      text: "Christianity's impact",
      query: 'How has Christianity influenced world history and culture?',
    },
  ];

  const additionalContextQuestions = [
    {
      icon: Book,
      text: 'Explain the passage',
      query: 'What does this passage mean?',
    },
    {
      icon: Image,
      text: 'Show a visual',
      query: 'Create an image based on this passage.',
    },
    {
      icon: Heart,
      text: 'Apply the passage',
      query: 'How can I apply this passage to my life?',
    },
    {
      icon: Globe,
      text: 'Explore the passage',
      query: 'What other passages are related to this one?',
    },
  ];

  return (
    <section
      class='flex h-full w-full flex-col items-center justify-center p-4'
      aria-label='Chat suggestions'
    >
      <GradientH3 class='mb-6'>Start a conversation</GradientH3>
      <div class='grid w-full max-w-sm grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-3'>
        <For each={props.additionalContext ? additionalContextQuestions : questions}>
          {({ text, query, icon: Icon }) => (
            <Button
              variant='outline'
              class='h-auto w-full py-3 text-left'
              onClick={() => append({ role: 'user', content: query })}
              aria-label={`Ask: ${text}`}
            >
              <Icon class='mr-3 inline-block size-5 shrink-0 sm:size-6' aria-hidden='true' />
              <span class='text-sm sm:text-base'>{text}</span>
            </Button>
          )}
        </For>
      </div>
    </section>
  );
};
