import { db } from '@theaistudybible/core/database';

export async function getSmallPickerData() {
  'use server';
  return await db.query.bibles.findMany();
}
