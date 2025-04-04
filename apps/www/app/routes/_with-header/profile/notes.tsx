import { db } from '@/core/database';
import { NoteItemCard } from '@/www/components/bible/reader/activity-panel/notes/note-item-card';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Input } from '@/www/components/ui/input';
import { Spinner } from '@/www/components/ui/spinner';
import { H2, H6 } from '@/www/components/ui/typography';
import { authMiddleware } from '@/www/server/middleware/auth';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { count, ilike } from 'drizzle-orm';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

export const Route = createFileRoute('/_with-header/profile/notes')({
  head: () => {
    const title =
      'Bible Notes & Annotations | The AI Study Bible - Your Personal Bible Study Notes';
    const description =
      'Access and manage your personal Bible study notes, annotations, and insights. Create, view, and organize your Bible study notes with The AI Study Bible.';

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'og:title', content: title },
        { name: 'og:description', content: description },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
    };
  },
  component: RouteComponent,
});

const getNotes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      limit: z.number(),
      offset: z.number(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data: { limit, offset, search }, context }) => {
    'use server';
    const { user } = context;
    if (!user) {
      return { notes: [], nextCursor: null };
    }

    // First get total counts to help with pagination
    const [verseCountResult, chapterCountResult] = await Promise.all([
      db.query.verseNotes.findMany({
        columns: {},
        where: (verseNotes, { and, eq }) => {
          const conditions = [eq(verseNotes.userId, user.id)];
          if (search) {
            conditions.push(ilike(verseNotes.content, `%${search}%`));
          }
          return and(...conditions);
        },
        extras: { count: count().as('count') },
      }),
      db.query.chapterNotes.findMany({
        columns: {},
        where: (chapterNotes, { and, eq }) => {
          const conditions = [eq(chapterNotes.userId, user.id)];
          if (search) {
            conditions.push(ilike(chapterNotes.content, `%${search}%`));
          }
          return and(...conditions);
        },
        extras: { count: count().as('count') },
      }),
    ]);

    const verseCount = verseCountResult[0].count;
    const chapterCount = chapterCountResult[0].count;

    // Calculate proper offset and limit for each query
    const verseOffset = offset > verseCount ? 0 : offset;
    const verseLimit = Math.min(limit, Math.max(0, verseCount - verseOffset));

    const chapterOffset = Math.max(0, offset - verseCount);
    const chapterLimit = Math.min(limit - verseLimit, Math.max(0, chapterCount - chapterOffset));

    const [verseNotes, chapterNotes] = await Promise.all([
      verseLimit > 0
        ? db.query.verseNotes.findMany({
            where: (verseNotes, { and, eq }) => {
              const conditions = [eq(verseNotes.userId, user.id)];
              if (search) {
                conditions.push(ilike(verseNotes.content, `%${search}%`));
              }
              return and(...conditions);
            },
            with: {
              verse: {
                columns: { content: false },
                with: {
                  chapter: { columns: { content: false } },
                  bible: true,
                  book: true,
                },
              },
            },
            limit: verseLimit,
            offset: verseOffset,
          })
        : Promise.resolve([]),
      chapterLimit > 0
        ? db.query.chapterNotes.findMany({
            where: (chapterNotes, { and, eq }) => {
              const conditions = [eq(chapterNotes.userId, user.id)];
              if (search) {
                conditions.push(ilike(chapterNotes.content, `%${search}%`));
              }
              return and(...conditions);
            },
            with: {
              chapter: {
                columns: { content: false },
                with: { bible: true, book: true },
              },
            },
            limit: chapterLimit,
            offset: chapterOffset,
          })
        : Promise.resolve([]),
    ]);

    const notes = [...verseNotes, ...chapterNotes];

    return {
      notes,
      nextCursor: notes.length === limit ? offset + limit : null,
    };
  });

const getNotesQueryOptions = (input: { search?: string } = {}) => ({
  queryKey: ['notes', input],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getNotes({ data: { limit: 9, offset: pageParam, search: input.search } }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getNotes>>) => lastPage.nextCursor,
});

function RouteComponent() {
  const [search, setSearch] = useState('');

  const notesQuery = useInfiniteQuery({
    ...getNotesQueryOptions({ search }),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <div className='flex h-full w-full flex-col items-center p-5'>
        <div className='flex w-full max-w-lg flex-col items-center gap-2'>
          <H2 className='inline-block w-fit bg-linear-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
            Your Notes
          </H2>
          <div className='relative w-full'>
            <Search className='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground' />
            <Input
              className='pr-8 pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant='ghost'
                size='icon'
                className='-translate-y-1/2 absolute top-1/2 right-1 size-6 p-0.5'
                onClick={() => setSearch('')}
              >
                <X className='size-4' />
              </Button>
            )}
          </div>
        </div>
        <div className='mt-5 grid w-full max-w-lg grid-cols-1 gap-3 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3'>
          <QueryBoundary
            query={notesQuery}
            render={({ pages }) => {
              const notes = pages.flatMap((page) => page.notes);

              if (notes.length === 0) {
                return (
                  <div className='flex h-full w-full flex-col items-center justify-center p-5 transition-all lg:col-span-3'>
                    <H6 className='text-center'>
                      No notes yet, get{' '}
                      <Link to='/bible' className='hover:underline'>
                        reading
                      </Link>
                      !
                    </H6>
                  </div>
                );
              }

              return notes.map((note) => (
                <NoteItemCard
                  key={note.id}
                  note={note}
                  bible={'verse' in note ? note.verse.bible : note.chapter.bible}
                  book={'verse' in note ? note.verse.book : note.chapter.book}
                  chapter={'verse' in note ? note.verse.chapter : note.chapter}
                  verse={'verse' in note ? note.verse : undefined}
                  showViewButton
                />
              ));
            }}
          />
          <div className='flex w-full justify-center lg:col-span-3'>
            {notesQuery.isFetchingNextPage ? (
              <Spinner size='sm' />
            ) : notesQuery.hasNextPage ? (
              <Button
                onClick={() => {
                  void notesQuery.fetchNextPage();
                }}
              >
                Load more
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
