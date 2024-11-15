import { Readable } from 'node:stream';
import { createBrotliCompress, createGzip } from 'node:zlib';
import { captureException as captureSentryException } from '@sentry/solidstart';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';

const compressibleTypes = [
  'text/',
  'application/json',
  'application/javascript',
  'application/xml',
  'application/x-www-form-urlencoded',
];

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', async (event, response) => {
    const contentType = event.node.res.getHeader('content-type');
    if (
      !contentType ||
      typeof contentType !== 'string' ||
      !compressibleTypes.some((type) => contentType.startsWith(type))
    ) {
      return;
    }

    // Only compress strings and buffers
    if (typeof response.body !== 'string' && !Buffer.isBuffer(response.body)) {
      return;
    }

    const acceptedEncoding = event.node.req.headers['accept-encoding'];
    if (acceptedEncoding && !Array.isArray(acceptedEncoding) && response.body) {
      // Remove content-length as it's no longer valid
      event.node.res.removeHeader('Content-Length');

      try {
        const readable = Readable.from(response.body);

        if (acceptedEncoding.includes('br')) {
          event.node.res.setHeader('Content-Encoding', 'br');
          const brotli = createBrotliCompress();

          // Handle compression stream errors
          brotli.on('error', (err) => {
            captureSentryException(err);
            brotli.destroy();
            readable.destroy();
          });

          // Stream the compressed response
          response.body = readable.pipe(brotli);
        } else if (acceptedEncoding.includes('gzip')) {
          event.node.res.setHeader('Content-Encoding', 'gzip');
          const gzip = createGzip();

          // Handle compression stream errors
          gzip.on('error', (err) => {
            captureSentryException(err);
            gzip.destroy();
            readable.destroy();
          });

          // Stream the compressed response
          response.body = readable.pipe(gzip);
        }
      } catch (err) {
        captureSentryException(err);
        event.node.res.removeHeader('Content-Encoding');
        // Keep original response.body
      }
    }
  });
});
