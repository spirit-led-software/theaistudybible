import fs from 'node:fs';
import path from 'node:path';

export function walkDirectory(directory: string, recursive = true): string[] {
  const files: string[] = [];

  const entries = fs.readdirSync(directory);

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = fs.statSync(fullPath);

    if (stats.isFile()) {
      files.push(fullPath);
    } else if (stats.isDirectory() && recursive) {
      files.push(...walkDirectory(fullPath, recursive)); // Recursively walk subdirectories
    }
  }

  return files;
}
