import { db } from '@/core/database';
import { chapterNotes, verseNotes } from '@/core/database/schema';
import { contentsToText } from '@/core/utils/bibles/contents-to-text';
import type { ChapterNote, VerseNote } from '@/schemas/bibles/types';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { Label } from '@/www/components/ui/label';
import { Markdown } from '@/www/components/ui/markdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/www/components/ui/select';
import { Textarea } from '@/www/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { P } from '@/www/components/ui/typography';
import type { SelectedVerseInfo } from '@/www/contexts/bible-reader';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { requireAuthMiddleware } from '@/www/server/middleware/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const addNote = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      chapterCode: z.string(),
      verseNumber: z.number().optional(),
      content: z.string().min(1),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user } = context;
    let note: VerseNote | ChapterNote;
    if (data.verseNumber) {
      [note] = await db
        .insert(verseNotes)
        .values({
          userId: user.id,
          bibleAbbreviation: data.bibleAbbreviation,
          verseCode: `${data.chapterCode}.${data.verseNumber}`,
          content: data.content,
        })
        .returning();
    } else {
      [note] = await db
        .insert(chapterNotes)
        .values({
          userId: user.id,
          bibleAbbreviation: data.bibleAbbreviation,
          chapterCode: data.chapterCode,
          content: data.content,
        })
        .returning();
    }
    return { note };
  });

export type AddNoteCardProps = {
  onAdd?: () => void;
  onCancel?: () => void;
};

export const AddNoteCard = (props: AddNoteCardProps) => {
  const qc = useQueryClient();
  const brStore = useBibleReaderStore();

  const [selectedVerseInfo, setSelectedVerseInfo] = useState<SelectedVerseInfo | undefined>(
    brStore.selectedVerseInfos[0],
  );
  const [contentValue, setContentValue] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const addNoteMutation = useMutation({
    mutationFn: (props: {
      bibleAbbreviation: string;
      chapterCode: string;
      verseNumber?: number;
      content: string;
    }) => addNote({ data: props }),
    onError: (err) => {
      toast.error(`Failed to add note: ${err.message}`);
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['notes'],
      }),
  });

  return (
    <Card className='transition-all'>
      <CardHeader>
        <CardTitle>Add Note</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!brStore.verse && brStore.selectedVerseInfos.length && (
          <div className='flex items-center space-x-1'>
            <Label htmlFor='verse-select'>Verse</Label>
            <Select
              value={selectedVerseInfo?.number.toString()}
              onValueChange={(value) =>
                setSelectedVerseInfo(
                  brStore.selectedVerseInfos.find((v) => v.number === Number(value)),
                )
              }
            >
              <SelectTrigger aria-label='Verse Number'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brStore.selectedVerseInfos.map((v) => (
                  <SelectItem key={v.number} value={v.number.toString()}>
                    {v.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {brStore.verse?.content?.length ||
          (brStore.selectedVerseInfos.length && (
            <P>
              {brStore.verse
                ? contentsToText(brStore.verse.content!)
                : brStore.selectedVerseInfos.find((v) => v.number === selectedVerseInfo?.number)
                    ?.text}
            </P>
          ))}
        <div className='space-y-2'>
          <div className='flex w-full items-center justify-between'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label className='flex items-center'>
                  Content <HelpCircle size={16} className='ml-1' />
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                Accepts{' '}
                <Button asChild variant='link' size='sm' className='p-0'>
                  <a href='https://www.markdownguide.org/'>markdown</a>
                </Button>
              </TooltipContent>
            </Tooltip>
            <Button
              asChild
              variant='link'
              size='sm'
              className='p-0 text-xs hover:no-underline'
              onClick={() => setShowPreview(!showPreview)}
            >
              <Label>{showPreview ? 'Hide Preview' : 'Show Preview'}</Label>
            </Button>
          </div>
          {showPreview ? (
            <div className='whitespace-pre-wrap rounded-lg border bg-background p-5'>
              <Markdown>{contentValue}</Markdown>
            </div>
          ) : (
            <Textarea
              value={contentValue}
              onChange={(e) => setContentValue(e.target.value)}
              placeholder='Add a note'
            />
          )}
        </div>
      </CardContent>
      <CardFooter className='flex justify-end space-x-2'>
        <Button onClick={props.onCancel} variant='outline'>
          Cancel
        </Button>
        <Button
          disabled={!contentValue.trim()}
          onClick={() => {
            addNoteMutation.mutate({
              bibleAbbreviation: brStore.bible.abbreviation,
              chapterCode: brStore.chapter.code,
              verseNumber: brStore.verse?.number ?? selectedVerseInfo?.number,
              content: contentValue,
            });
            props.onAdd?.();
          }}
        >
          Save
        </Button>
      </CardFooter>
    </Card>
  );
};
