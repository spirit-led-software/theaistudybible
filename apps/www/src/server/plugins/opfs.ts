import { setResponseHeader } from 'h3';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    setResponseHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin');
    setResponseHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp');
  });
});
