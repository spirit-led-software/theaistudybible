import { parseUsx } from '@scripts/lib/bible/usx';
import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

describe('USX Tests', () => {
  test('Parse USX test', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, 'MAT.usx'), 'utf-8');
    const usx = parseUsx(file);
    fs.writeFileSync(path.resolve(__dirname, 'MAT.json'), JSON.stringify(usx, null, 2));
    expect(usx).toBeDefined();
  });
});
