<script lang="ts">
  import { enhance } from '$app/forms';
  import Icon from '@iconify/svelte';
  import type { UpstashVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/upstash';
  import type { ActionData, SubmitFunction } from './$types';

  export let form: ActionData;

  let isLoading = false;
  let alert: { type: 'error' | 'success'; text: string } | undefined = undefined;
  let results: (Omit<UpstashVectorStoreDocument, 'vector'> & { score: number })[] = [];

  const submit: SubmitFunction = () => {
    isLoading = true;

    return async ({ update }) => {
      isLoading = false;
      await update();
    };
  };

  const examples = [
    'Where did Jesus grow up?',
    'Ephesians 5:33',
    'Who is the Holy Spirit?',
    'What is the meaning of life?',
    'John Calvin',
    "Who is the 'I am' in the Bible?",
    'What does Yahweh mean?'
  ];

  $: if (form?.errors?.banner) {
    alert = {
      type: 'error',
      text: form.errors.banner
    };
  }
  $: if (form?.success?.banner) {
    alert = {
      type: 'success',
      text: form.success.banner
    };
  }

  $: if (form?.success?.results && form.success.results.length > 0) {
    results = form.success.results;
  }

  $: if (alert) setTimeout(() => (alert = undefined), 8000);
</script>

<svelte:head>
  <title>Resource Search</title>
  <meta
    name="description"
    content="Search our database of trusted Christian resources using vector similarity search."
  />
</svelte:head>

<div class="flex h-full w-full flex-col overflow-hidden">
  <div class="flex h-full w-full flex-col space-y-2 overflow-hidden p-3 lg:px-16">
    <form
      use:enhance={submit}
      class="flex w-full flex-col justify-center"
      method="post"
      action="?/search"
    >
      <div class="mb-2 flex w-full flex-col">
        <h1 class="text-xl font-medium"><span class="text-blue-300">AI</span>-Powered Search</h1>
        <p class="text-xs text-gray-400">
          Find Christian resources using vector similarity search.
        </p>
        <p class="text-xs text-gray-400">
          This is <strong class="font-bold">not</strong> a web search. All sources have been hand-selected
          ahead of time.
        </p>
      </div>
      <div class="join">
        {#if alert}
          <div class="join-item w-full border">
            <div
              class={`flex h-full w-full place-items-center justify-center text-center ${
                alert.type === 'success' ? 'bg-green-200' : 'bg-red-200'
              }`}
            >
              {alert.text}
            </div>
          </div>
        {:else}
          <input
            type="text"
            id="query"
            name="query"
            placeholder={examples[Math.floor(Math.random() * examples.length)]}
            class="input input-bordered join-item w-full"
            disabled={isLoading}
          />
        {/if}
        <button type="submit" class="btn join-item bg-slate-700 text-white hover:bg-slate-900">
          {#if isLoading}
            <span class="loading loading-xs loading-spinner" />
          {:else}
            <Icon icon="mdi:arrow-right" width={16} height={16} />
          {/if}
        </button>
      </div>
    </form>
    <div class="flex h-full w-full flex-col overflow-y-scroll rounded-xl border">
      {#if results.length > 0}
        {#each results as result}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={result.metadata.url}
            class="flex w-full flex-col border p-3"
          >
            <div class="flex w-full flex-col">
              {#if result.metadata.title}
                <div class="text-lg font-bold">{result.metadata.title}</div>
                {#if result.metadata.author}
                  <div class="text-xs text-gray-500">by {result.metadata.author}</div>
                {/if}
              {:else}
                <div class="text-lg font-bold">{result.metadata.name}</div>
              {/if}
              <div class="mt-2">
                <h2 class="mb-1 text-sm font-medium">Snippet:</h2>
                <div
                  class="max-h-16 w-full truncate whitespace-break-spaces break-words text-xs text-gray-500"
                >
                  {result.pageContent.split(/\n---\n/g)[1]?.trim()}
                </div>
              </div>
              <div class="mt-3 flex w-full justify-center space-x-1">
                <div class="h-1 w-1 rounded-full bg-slate-700" />
                <div class="h-1 w-1 rounded-full bg-slate-700" />
                <div class="h-1 w-1 rounded-full bg-slate-700" />
              </div>
              <div class="mt-2 flex place-items-end justify-between">
                <div class="flex flex-col">
                  <div class="flex space-x-1">
                    <div class="text-xs font-medium">Type:</div>
                    <div class="text-xs text-gray-500">{result.metadata.type}</div>
                  </div>
                  <div class="flex space-x-2">
                    {#if result.metadata?.loc?.pageNumber}
                      <div class="flex space-x-1">
                        <div class="text-xs font-medium">Page Number:</div>
                        <div class="text-xs text-gray-500">{result.metadata.loc.pageNumber}</div>
                      </div>
                    {/if}
                    {#if result.metadata?.loc?.lines && result.metadata.type !== 'Webpage'}
                      <div class="flex space-x-1">
                        <div class="text-xs font-medium">Lines:</div>
                        <div class="text-xs text-gray-500">
                          {result.metadata.loc.lines.from}-{result.metadata.loc.lines.to}
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
                <div class="flex space-x-1">
                  <div class="text-xs font-medium">Similarity Score:</div>
                  <div class="text-xs text-gray-500">{((1.0 - result.score) * 100).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </a>
        {/each}
      {:else}
        <div class="flex h-full w-full flex-col place-items-center justify-center">
          <div class="text-lg font-medium">No Results Yet.</div>
        </div>
      {/if}
    </div>
  </div>
</div>
