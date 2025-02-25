import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { createBrotliCompress, createDeflate, createGzip } from 'node:zlib';
import { captureException as captureSentryException } from '@sentry/solidstart';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import {
  type H3Event,
  getRequestHeader,
  getResponseHeader,
  removeResponseHeader,
  setResponseHeader,
} from 'vinxi/http';

const compressibleTypes = [
  'text/',
  'application/json',
  'application/javascript',
  'application/xml',
  'application/x-www-form-urlencoded',
  'application/graphql',
  'application/ld+json',
  'application/x-javascript',
  'application/ecmascript',
  'application/x-httpd-php',
  'font/',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-',
  'application/rtf',
  'application/pdf',
  'application/atom+xml',
  'application/rss+xml',
  'application/soap+xml',
  'application/vnd.api+json',
];

const supportedEncodings = ['gzip', 'br', 'deflate'];

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event, response) => {
    compressResponse(event, response);
  });
});

function compressResponse(event: H3Event, response: { body?: unknown }) {
  // If the response is already compressed, don't compress it again
  const contentEncoding = getResponseHeader(event, 'Content-Encoding');
  if (contentEncoding) {
    return;
  }

  // If the response is not a compressible type, don't compress it
  const contentType = getResponseHeader(event, 'Content-Type');
  if (
    !contentType ||
    typeof contentType !== 'string' ||
    !compressibleTypes.some((t) => contentType.startsWith(t))
  ) {
    return;
  }

  // If the response body is undefined or null, don't compress it
  if (typeof response.body === 'undefined' || response.body === null) {
    return;
  }

  const acceptedEncoding = getRequestHeader(event, 'accept-encoding');
  if (
    acceptedEncoding &&
    typeof acceptedEncoding === 'string' &&
    supportedEncodings.some((e) => acceptedEncoding.includes(e))
  ) {
    removeResponseHeader(event, 'Content-Length');

    let compressor:
      | ReturnType<typeof createGzip>
      | ReturnType<typeof createBrotliCompress>
      | ReturnType<typeof createDeflate>
      | undefined;
    let readable: Readable | undefined;

    try {
      if (response.body instanceof Readable) {
        readable = response.body;
      } else if (typeof response.body === 'string') {
        readable = Readable.from(response.body);
      } else if (Buffer.isBuffer(response.body)) {
        readable = Readable.from(response.body);
      } else if (response.body instanceof ReadableStream) {
        readable = Readable.fromWeb(response.body);
      } else {
        readable = Readable.fromWeb(
          // biome-ignore lint/suspicious/noExplicitAny: Any type is fine here
          new Response(response.body as any).body! as unknown as ReadableStream,
        );
      }

      readable.on('end', () => readable?.destroy());
      readable.on('close', () => readable?.destroy());
      readable.on('error', (err) => {
        captureSentryException(err);
        readable?.destroy();
      });

      if (acceptedEncoding.includes('br')) {
        setResponseHeader(event, 'Content-Encoding', 'br');
        compressor = createBrotliCompress();
      } else if (acceptedEncoding.includes('gzip')) {
        setResponseHeader(event, 'Content-Encoding', 'gzip');
        compressor = createGzip();
      } else if (acceptedEncoding.includes('deflate')) {
        setResponseHeader(event, 'Content-Encoding', 'deflate');
        compressor = createDeflate();
      }

      if (compressor) {
        compressor.on('end', () => compressor?.destroy());
        compressor.on('close', () => compressor?.destroy());
        compressor.on('error', (err) => {
          captureSentryException(err);
          compressor?.destroy();
        });
        response.body = readable.pipe(compressor);
      }
    } catch (err) {
      removeResponseHeader(event, 'Content-Encoding');
      captureSentryException(err);
      compressor?.destroy();
      readable?.destroy();
    }
  }
}
