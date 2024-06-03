import type { RpcClient } from '$lib/types/rpc';

export const getBibles = (rpcClient: RpcClient) =>
  rpcClient.bibles.$get().then(async (res) => {
    if (res.ok) {
      return (await res.json()).data;
    }
    throw new Error('Error getting bibles');
  });

export const getBible = (rpcClient: RpcClient, bibleAbbr: string) =>
  rpcClient.bibles[':id']
    .$get({
      param: {
        id: bibleAbbr
      }
    })
    .then(async (res) => {
      if (res.ok) {
        return (await res.json()).data;
      }
      throw new Error('Error getting bible');
    });

export const getBooks = (rpcClient: RpcClient, bibleAbbr: string) =>
  rpcClient.bibles[':id'].books
    .$get({
      param: {
        id: bibleAbbr
      },
      query: {
        limit: '100',
        sort: 'number:asc'
      }
    })
    .then(async (res) => {
      if (res.ok) {
        return (await res.json()).data;
      }
      throw new Error('Error getting books');
    });

export const getBook = (rpcClient: RpcClient, bibleAbbr: string, bookAbbr: string) =>
  rpcClient.bibles[':id'].books[':bookId']
    .$get({
      param: {
        id: bibleAbbr,
        bookId: bookAbbr
      }
    })
    .then(async (res) => {
      if (res.ok) {
        return (await res.json()).data;
      }
      throw new Error('Error getting book');
    });

export const getChapter = (
  rpcClient: RpcClient,
  bibleAbbr: string,
  bookAbbr: string,
  chapterNum: string
) =>
  rpcClient.bibles[':id'].chapters[':chapterId']
    .$get({
      param: {
        id: bibleAbbr,
        chapterId: `${bookAbbr}.${chapterNum}`
      },
      query: {
        'include-content': 'true'
      }
    })
    .then(async (res) => {
      if (res.ok) {
        return (await res.json()).data;
      }
      throw new Error('Failed to fetch chapter');
    });

export const getChapterHighlights = (
  rpcClient: RpcClient,
  bibleAbbr: string,
  bookAbbr: string,
  chapterNum: string
) =>
  rpcClient.bibles[':id'].chapters[':chapterId'].highlights
    .$get({
      param: {
        id: bibleAbbr,
        chapterId: `${bookAbbr}.${chapterNum}`
      }
    })
    .then(async (res) => {
      if (res.ok) {
        return (await res.json()).data;
      }
      return null;
    });
