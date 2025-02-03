import { defineConfig } from 'cypress';
import { Resource } from 'sst';

export default defineConfig({
  e2e: {
    baseUrl: Resource.WebAppUrl.value,
    env: {
      ADMIN_EMAIL: Resource.AdminEmail.value,
      ADMIN_PASSWORD: Resource.AdminPassword.value,
      TEST_USER_EMAIL: Resource.TestUserEmail.value,
      TEST_USER_PASSWORD: Resource.TestUserPassword.value,
    },
    defaultCommandTimeout: 1000 * (Resource.Dev.value === 'true' ? 20 : 10),
    retries: { runMode: 2 },
    includeShadowDom: true,
  },
});
