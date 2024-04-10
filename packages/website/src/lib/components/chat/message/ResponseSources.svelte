<script lang="ts">
  import { PUBLIC_API_URL } from '$env/static/public';
  import * as Accordion from '$lib/components/ui/accordion';
  import { Spinner } from '$lib/components/ui/spinner';
  import { session } from '$lib/stores/user';
  import { graphql } from '@revelationsai/client/graphql';
  import type { SourceDocument } from '@revelationsai/core/model/source-document';
  import { createQuery } from '@tanstack/svelte-query';
  import graphqlRequest from 'graphql-request';
  import { derived, writable } from 'svelte/store';

  let argAiResponseId: string;
  export { argAiResponseId as aiResponseId };

  const aiResponseId = writable(argAiResponseId);
  $: aiResponseId.set(argAiResponseId);

  let argIsChatLoading = false;
  export { argIsChatLoading as isChatLoading };
  const isChatLoading = writable(argIsChatLoading);
  $: isChatLoading.set(argIsChatLoading);

  let sourceDocs = writable<Pick<SourceDocument, 'id' | 'metadata'>[]>([]);

  const graphqlQuery = graphql(`
    query GetAiResponseSourceDocuments($aiResponseId: String!) {
      aiResponse(id: $aiResponseId) {
        id
        sourceDocuments {
          id
          metadata
        }
      }
    }
  `);

  const query = createQuery(
    derived([session, aiResponseId], ([$session, $aiResponseId]) => ({
      queryKey: [
        'ai-response-source-documents',
        { aiResponseId: $aiResponseId, session: $session }
      ],
      queryFn: async () => {
        return await graphqlRequest(
          `${PUBLIC_API_URL}/graphql`,
          graphqlQuery,
          {
            aiResponseId: $aiResponseId
          },
          {
            authorization: `Bearer ${$session}`
          }
        );
      }
    }))
  );
  query.subscribe(({ data }) => {
    if (data?.aiResponse?.sourceDocuments) {
      sourceDocs.set(
        data.aiResponse.sourceDocuments
          .map((doc) => ({
            id: doc.id,
            metadata: JSON.parse(doc.metadata)
          }))
          .filter(
            (doc, index, arr) => arr.findIndex((d) => d.metadata.url === doc.metadata.url) === index
          )
      );
    }
  });

  $: isLoading = $isChatLoading || $query.isLoading;
</script>

<Accordion.Root class="border-foreground w-full rounded-xl border border-opacity-15 px-3 py-1">
  <Accordion.Item value="sources" class="border-b-0">
    <Accordion.Trigger
      class="text-foreground flex w-full place-items-center text-sm"
      disabled={isLoading}
    >
      <div class="flex place-items-center justify-start">
        All Sources
        {#if isLoading}
          <Spinner size="sm" class="ml-2" variant="foreground" />
        {:else}
          ({$sourceDocs.length})
        {/if}
      </div>
    </Accordion.Trigger>
    <Accordion.Content>
      {#if $sourceDocs.length > 0}
        <ol class="flex w-full list-outside list-decimal flex-col space-y-1">
          {#each $sourceDocs as sourceDoc (sourceDoc.id)}
            <li class={`list-item truncate text-xs text-gray-400`}>
              <a
                href={sourceDoc.metadata.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                class="hover:underline"
              >
                <span>{sourceDoc.metadata.title ?? sourceDoc.metadata.name}</span>
                {#if sourceDoc.metadata.author}
                  <span class="ml-1 text-slate-500">by {sourceDoc.metadata.author}</span>
                {/if}
              </a>
            </li>
          {/each}
        </ol>
      {:else}
        <ul class="flex w-full flex-col space-y-1">
          <li class={`truncate text-xs text-gray-400`}>None</li>
        </ul>
      {/if}
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
