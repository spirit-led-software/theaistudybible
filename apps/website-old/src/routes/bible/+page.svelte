<script lang="ts">
  import TranslationPicker from '$lib/components/bible/translation-picker.svelte';
  import { P } from '$lib/components/ui/typeography';
  import { createQuery } from '@tanstack/svelte-query';
  import type { PageData } from '../$types';
  import { getBibles } from './data';

  export let data: PageData;

  let biblesQuery = createQuery({
    queryKey: ['bibles'],
    queryFn: async () => await getBibles(data.rpcClient)
  });
</script>

<div class="flex h-full w-full flex-col p-5 text-center">
  {#if $biblesQuery.isLoading}
    <div class="flex h-full w-full flex-col items-center justify-center">
      <div class="animate-pulse rounded-md bg-muted"></div>
    </div>
  {:else if $biblesQuery.isError}
    <div class="flex h-full w-full flex-col items-center justify-center">
      <P>Failed to load bibles</P>
    </div>
  {:else if $biblesQuery.data}
    <TranslationPicker bibles={$biblesQuery.data} />
  {/if}
</div>
