import fs from 'node:fs';
import path from 'node:path';
import { parseUsx } from '@/core/utils/bibles/usx';
import { describe, expect, test } from 'vitest';

describe('USX Tests', () => {
  test('Parse USX test', () => {
    const file = fs.readFileSync(path.resolve(__dirname, 'MAT.usx'), 'utf-8');
    const usx = parseUsx(file);
    fs.writeFileSync(path.resolve(__dirname, 'MAT.json'), JSON.stringify(usx, null, 2));
    expect(usx).toBeDefined();
  });
});
