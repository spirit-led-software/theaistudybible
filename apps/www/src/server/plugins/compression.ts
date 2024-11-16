import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { createBrotliCompress, createDeflate, createGzip } from 'node:zlib';
import { captureException as captureSentryException } from '@sentry/solidstart';
import {
  type H3Event,
  getRequestHeader,
  getResponseHeader,
  removeResponseHeader,
  setResponseHeader,
} from 'h3';
import { defineNitroPlugin } from 'nitropack/runtime';

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
  const contentEncoding = getResponseHeader(event, 'Content-Encoding');
  if (contentEncoding) {
    return;
  }

  const contentType = getResponseHeader(event, 'Content-Type');
  if (
    !contentType ||
    typeof contentType !== 'string' ||
    !compressibleTypes.some((t) => contentType.startsWith(t))
  ) {
    return;
  }

  if (
    typeof response.body === 'undefined' ||
    (typeof response.body !== 'string' &&
      !Buffer.isBuffer(response.body) &&
      !(response.body instanceof ReadableStream) &&
      !(response.body instanceof Readable))
  ) {
    return;
  }

  const acceptedEncoding = getRequestHeader(event, 'accept-encoding');
  if (
    acceptedEncoding &&
    typeof acceptedEncoding === 'string' &&
    supportedEncodings.some((e) => acceptedEncoding.includes(e))
  ) {
    // Remove content-length as it's no longer valid
    removeResponseHeader(event, 'Content-Length');
    try {
      const stream = (
        response.body instanceof ReadableStream
          ? response.body
          : response.body instanceof Readable
            ? ReadableStream.from(response.body)
            : new Response(response.body).body!
      ) as ReadableStream;
      const readable = Readable.fromWeb(stream);

      if (acceptedEncoding.includes('gzip')) {
        setResponseHeader(event, 'Content-Encoding', 'gzip');
        const gzip = createGzip();
        gzip.on('error', (err) => {
          captureSentryException(err);
          gzip.destroy();
          stream.cancel();
          readable.destroy();
        });
        response.body = readable.pipe(gzip);
      } else if (acceptedEncoding.includes('br')) {
        // TODO: Put brotli second because it is not optimized in bun yet (too much memory):
        // https://bun.sh/docs/runtime/nodejs-apis
        setResponseHeader(event, 'Content-Encoding', 'br');
        const brotli = createBrotliCompress();
        brotli.on('error', (err) => {
          captureSentryException(err);
          brotli.destroy();
          stream.cancel();
          readable.destroy();
        });
        response.body = readable.pipe(brotli);
      } else if (acceptedEncoding.includes('deflate')) {
        setResponseHeader(event, 'Content-Encoding', 'deflate');
        const deflate = createDeflate();
        deflate.on('error', (err) => {
          captureSentryException(err);
          deflate.destroy();
          stream.cancel();
          readable.destroy();
        });
        response.body = readable.pipe(deflate);
      }
    } catch (err) {
      captureSentryException(err);
      removeResponseHeader(event, 'Content-Encoding');
    }
  }
}
