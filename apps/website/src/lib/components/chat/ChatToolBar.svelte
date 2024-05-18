<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Select from '$lib/components/ui/select';
  import { user } from '$lib/stores/user';
  import { hasPlus, isAdmin } from '@revelationsai/client/services/user';
  import type { ModelInfo } from '@revelationsai/core/model/llm';
  import ShareChatButton from './ShareChatButton.svelte';

  export let modelInfos: { [key: string]: ModelInfo };
  export let chatId: string | undefined;
  export let modelId: string | undefined;

  $: userHasPlus = hasPlus($user!) || isAdmin($user!);
</script>

<div
  class="flex w-fit place-items-center justify-center overflow-hidden rounded-xl bg-slate-700 text-center"
>
  <ShareChatButton {chatId} />
  <Select.Root
    selected={{
      value: modelId ?? Object.keys(modelInfos)[0],
      label: modelInfos[modelId ?? Object.keys(modelInfos)[0]]?.name ?? modelId
    }}
    onSelectedChange={async (v) => {
      if (v) {
        if (modelInfos[v.value].tier === 'plus' && !userHasPlus) {
          await goto('/upgrade');
        } else {
          modelId = v.value;
        }
      }
    }}
  >
    <Select.Trigger
      class="bg-primary border-none text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0"
    >
      <Select.Value placeholder="Select a model" />
    </Select.Trigger>
    <Select.Content class="bg-slate-700">
      {#each Object.keys(modelInfos) as modelId}
        <Select.Item
          value={modelId}
          label={modelInfos[modelId].name}
          class="bg-slate-700 text-white hover:bg-slate-900 data-[highlighted]:bg-slate-900 data-[highlighted]:text-white"
        />
      {/each}
    </Select.Content>
  </Select.Root>
</div>
