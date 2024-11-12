import path from 'node:path';

export function getContentType(filename: string, textEncoding: string) {
  const ext = filename.endsWith('.well-known/site-association-json')
    ? '.json'
    : path.extname(filename);
  const extensions = {
    '.txt': { mime: 'text/plain', isText: true },
    '.htm': { mime: 'text/html', isText: true },
    '.html': { mime: 'text/html', isText: true },
    '.xhtml': { mime: 'application/xhtml+xml', isText: true },
    '.css': { mime: 'text/css', isText: true },
    '.js': { mime: 'text/javascript', isText: true },
    '.mjs': { mime: 'text/javascript', isText: true },
    '.apng': { mime: 'image/apng', isText: false },
    '.avif': { mime: 'image/avif', isText: false },
    '.gif': { mime: 'image/gif', isText: false },
    '.jpeg': { mime: 'image/jpeg', isText: false },
    '.jpg': { mime: 'image/jpeg', isText: false },
    '.png': { mime: 'image/png', isText: false },
    '.svg': { mime: 'image/svg+xml', isText: true },
    '.bmp': { mime: 'image/bmp', isText: false },
    '.tiff': { mime: 'image/tiff', isText: false },
    '.webp': { mime: 'image/webp', isText: false },
    '.ico': { mime: 'image/vnd.microsoft.icon', isText: false },
    '.eot': { mime: 'application/vnd.ms-fontobject', isText: false },
    '.ttf': { mime: 'font/ttf', isText: false },
    '.otf': { mime: 'font/otf', isText: false },
    '.woff': { mime: 'font/woff', isText: false },
    '.woff2': { mime: 'font/woff2', isText: false },
    '.json': { mime: 'application/json', isText: true },
    '.jsonld': { mime: 'application/ld+json', isText: true },
    '.xml': { mime: 'application/xml', isText: true },
    '.pdf': { mime: 'application/pdf', isText: false },
    '.zip': { mime: 'application/zip', isText: false },
    '.wasm': { mime: 'application/wasm', isText: false },
    '.webmanifest': { mime: 'application/manifest+json', isText: true },
  };
  const extensionData = extensions[ext as keyof typeof extensions];
  const mime = extensionData?.mime ?? 'application/octet-stream';
  const charset =
    extensionData?.isText && textEncoding !== 'none' ? `;charset=${textEncoding}` : '';
  return `${mime}${charset}`;
}
