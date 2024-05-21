const originalFetch = globalThis.fetch;

globalThis.fetch = async function (...args) {
  if (typeof args[1] === 'object') {
    const newOpts = { ...args[1] };
    delete newOpts.cache;
    return await originalFetch.apply(this, [args[0], newOpts]);
  }
  return await originalFetch.apply(this, args);
};

export default globalThis.fetch;
