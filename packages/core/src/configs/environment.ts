export default {
  isLocal: process.env.IS_LOCAL === 'true',
  env: process.env.NODE_ENV || 'development',
  development: process.env.NODE_ENV !== 'production'
};
