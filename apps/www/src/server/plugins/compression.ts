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
    removeResponseHeader(event, 'Content-Length');

    let compressor:
      | ReturnType<typeof createGzip>
      | ReturnType<typeof createBrotliCompress>
      | ReturnType<typeof createDeflate>
      | undefined;
    let readable: Readable | undefined;

    try {
      const stream = (
        response.body instanceof ReadableStream
          ? response.body
          : response.body instanceof Readable
            ? ReadableStream.from(response.body)
            : new Response(response.body).body!
      ) as ReadableStream;
      readable = Readable.fromWeb(stream);

      readable.on('end', () => {
        readable?.destroy();
      });
      readable.on('error', (err) => {
        captureSentryException(err);
        readable?.destroy();
      });

      if (acceptedEncoding.includes('gzip')) {
        setResponseHeader(event, 'Content-Encoding', 'gzip');
        compressor = createGzip();
        compressor.on('end', () => {
          compressor?.destroy();
        });
        compressor.on('error', (err) => {
          captureSentryException(err);
          compressor?.destroy();
        });
        response.body = readable.pipe(compressor);
      } else if (acceptedEncoding.includes('br')) {
        setResponseHeader(event, 'Content-Encoding', 'br');
        compressor = createBrotliCompress();
        compressor.on('end', () => {
          compressor?.destroy();
        });
        compressor.on('error', (err) => {
          captureSentryException(err);
          compressor?.destroy();
        });
        response.body = readable.pipe(compressor);
      } else if (acceptedEncoding.includes('deflate')) {
        setResponseHeader(event, 'Content-Encoding', 'deflate');
        compressor = createDeflate();
        compressor.on('end', () => {
          compressor?.destroy();
        });
        compressor.on('error', (err) => {
          captureSentryException(err);
          compressor?.destroy();
        });
        response.body = readable.pipe(compressor);
      }
    } catch (err) {
      captureSentryException(err);
      removeResponseHeader(event, 'Content-Encoding');
      compressor?.destroy();
      readable?.destroy();
    }
  }
}
