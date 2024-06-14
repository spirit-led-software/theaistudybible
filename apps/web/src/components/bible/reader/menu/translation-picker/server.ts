import { db } from '@lib/server/database';

export async function getSmallPickerData() {
  'use server';
  return await db.query.bibles.findMany();
}
