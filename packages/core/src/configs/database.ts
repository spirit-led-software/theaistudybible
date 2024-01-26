const defaultUrl = 'postgres://postgres:postgres@localhost:5432/postgres';

const readWriteUrl = process.env.DATABASE_READWRITE_URL
  ? /^{{.*}}$/.test(process.env.DATABASE_READWRITE_URL)
    ? defaultUrl
    : process.env.DATABASE_READWRITE_URL
  : defaultUrl;

const readOnlyUrl = process.env.DATABASE_READONLY_URL
  ? /^{{.*}}$/g.test(process.env.DATABASE_READONLY_URL)
    ? undefined
    : process.env.DATABASE_READONLY_URL
  : undefined;

export const config = {
  readOnlyUrl: readOnlyUrl || readWriteUrl,
  readWriteUrl: readWriteUrl
};

export default config;
