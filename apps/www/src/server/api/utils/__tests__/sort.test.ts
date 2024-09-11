import { chats } from '@/core/database/schema';
import { parseSortString } from '@/www/server/api/utils/sort';
import { asc, desc } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';

describe('Sort string test suite', () => {
  test('Test sort string 1', () => {
    const sql = parseSortString(chats, 'id:asc;createdAt:desc');
    expect(sql).toEqual([asc(chats.id), desc(chats.createdAt)]);
  });
});
