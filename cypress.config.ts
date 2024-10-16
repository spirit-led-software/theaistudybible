import { defineConfig } from 'cypress';
import { Resource } from 'sst';

export default defineConfig({
  e2e: {
    baseUrl: Resource.WebAppUrl.value,
    env: {
      ADMIN_EMAIL: Resource.AdminEmail.value,
      ADMIN_PASSWORD: Resource.AdminPassword.value,
    },
    defaultCommandTimeout: Resource.Dev.value === 'true' ? 20000 : 5000,
  },
});
