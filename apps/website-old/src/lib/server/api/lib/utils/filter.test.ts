import { parseFilterString } from '$lib/server/api/lib/utils/filter';
import { chats } from '@theaistudybible/core/database/schema';
import { and, eq, ilike, inArray, or } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';

describe('Filter string test suite', () => {
  test('Test filter string 1', () => {
    const sql = parseFilterString(chats, 'id = "1234" and (name = "123" or customName = false)');
    expect(sql).toEqual(
      and(eq(chats.id, '1234'), or(eq(chats.name, '123'), eq(chats.customName, false)))
    );
  });

  test('Test filter string 2', () => {
    const sql = parseFilterString(chats, '((id = "1234" and name = "123") or customName = false)');
    expect(sql).toEqual(
      or(and(eq(chats.id, '1234'), eq(chats.name, '123')), eq(chats.customName, false))
    );
  });

  test('Test filter string 3', () => {
    const sql = parseFilterString(chats, 'id = "fake_id"');
    expect(sql).toEqual(eq(chats.id, 'fake_id'));
  });

  test('Test filter string 4', () => {
    const sql = parseFilterString(chats, 'id in ["1234", "fake_id"]');
    expect(sql).toEqual(inArray(chats.id, ['1234', 'fake_id']));
  });

  test('Test filter string 5', () => {
    const sql = parseFilterString(chats, 'id ~= "12%"');
    expect(sql).toEqual(ilike(chats.id, '12%'));
  });
});
