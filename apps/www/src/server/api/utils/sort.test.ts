import { chats } from '@theaistudybible/core/database/schema';
import { asc, desc } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { parseSortString } from '~/server/api/utils/sort';

describe('Sort string test suite', () => {
  test('Test sort string 1', () => {
    const sql = parseSortString(chats, 'id:asc;createdAt:desc');
    expect(sql).toEqual([asc(chats.id), desc(chats.createdAt)]);
  });
});
