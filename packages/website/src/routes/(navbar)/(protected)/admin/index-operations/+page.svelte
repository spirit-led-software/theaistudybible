<script lang="ts">
  import IndexOperationsDashboard from '$lib/components/admin/IndexOperationsDashboard.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  $: ({ indexOperations, limit } = data);
</script>

<svelte:head>
  <title>Index Operations</title>
</svelte:head>

<div class="flex h-full w-full p-5">
  <div class="flex w-full flex-col-reverse overflow-hidden">
    <div class="flex w-full flex-1 overflow-y-scroll">
      <IndexOperationsDashboard initIndexOps={indexOperations} {limit} />
    </div>
  </div>
</div>
