import type { bookmarkChapterTool } from '@/ai/chat/tools';
import { Button } from '@/www/components/ui/button';
import { H5, H6 } from '@/www/components/ui/typography';
import { Link } from '@tanstack/react-router';
import type { ToolInvocation } from 'ai';
import { Bookmark } from 'lucide-react';
import type { z } from 'zod';

export type BookmarkToolProps = {
  toolInvocation: ToolInvocation;
};

export const BookmarkTool = (props: BookmarkToolProps) => {
  const toolArgs = props.toolInvocation.args as z.infer<
    ReturnType<typeof bookmarkChapterTool>['parameters']
  >;

  const result =
    'result' in props.toolInvocation
      ? (props.toolInvocation.result as Awaited<
          ReturnType<ReturnType<typeof bookmarkChapterTool>['execute']>
        >)
      : null;

  return (
    <div className='flex w-full flex-col'>
      <H5 className='flex items-center'>
        <Bookmark className='mr-2' size={18} />
        Bookmark
      </H5>
      {toolArgs &&
        'chapterNumbers' in toolArgs &&
        toolArgs.chapterNumbers.map((chapterNumber) => (
          <span key={chapterNumber} className='text-sm'>
            {toolArgs.bookCode}.{chapterNumber}
          </span>
        ))}
      {result && (
        <div className='mt-1 flex flex-col'>
          <H6>Result</H6>
          {result.status === 'error' ? (
            <div className='flex flex-col'>
              <span>Failed</span>
              <span>{result.message}</span>
            </div>
          ) : (
            <div className='flex flex-col text-sm'>
              {result.status === 'success' &&
                'chapters' in result &&
                result.chapters.map((chapter) => (
                  <div key={chapter.number} className='flex items-center space-x-2'>
                    <span>
                      {result.book.shortName} {chapter.number}
                    </span>
                    <Button asChild variant='link' className='h-fit p-0 text-accent-foreground'>
                      <Link
                        to='/bible/$bibleAbbreviation/$bookCode/$chapterNumber'
                        params={{
                          bibleAbbreviation: result.bible.abbreviation,
                          bookCode: result.book.code,
                          chapterNumber: chapter.number,
                        }}
                      >
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
