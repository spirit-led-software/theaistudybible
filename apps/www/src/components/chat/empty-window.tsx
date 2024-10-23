import type { useChat } from '@/www/hooks/use-chat';
import { Book, Globe, Heart, Lightbulb, PenTool, Wrench } from 'lucide-solid';
import { Button } from '../ui/button';
import { GradientH3 } from '../ui/typography';

export type EmptyWindowProps = {
  append: ReturnType<typeof useChat>['append'];
};

export const EmptyWindow = (props: EmptyWindowProps) => {
  const questions = [
    {
      icon: Lightbulb,
      text: 'Who is Jesus Christ?',
      query: 'Who is Jesus Christ and why is He significant?',
    },
    { icon: Wrench, text: 'What tools can you use?', query: 'What tools do you have access to?' },
    {
      icon: Book,
      text: 'Explain a Bible passage',
      query: 'Can you explain the meaning of John 3:16?',
    },
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
    {
      icon: PenTool,
      text: 'Analyze a hymn',
      query: 'Can you analyze the lyrics of "Amazing Grace"?',
    },
  ];

  return (
    <div class='flex h-full w-full flex-col items-center justify-center p-4'>
      <GradientH3 class='mb-6'>Start a conversation</GradientH3>
      <div class='grid w-full max-w-sm grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-3'>
        {questions.map((question) => (
          <Button
            variant='outline'
            class='h-auto w-full py-3 text-left'
            onClick={() => props.append({ role: 'user', content: question.query })}
          >
            <question.icon class='mr-3 inline-block size-5 shrink-0 sm:size-6' />
            <span class='text-sm sm:text-base'>{question.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
