import posthog from 'posthog-js';
import { onMount } from 'svelte';

export const PosthogInit = () => {
  onMount(() => {
    posthog.init('phc_z3PcZTeDMCT53dKzb0aqDXkrM1o3LpNcC9QlJDdG9sO', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'always',
    });
  });
  return null;
};
