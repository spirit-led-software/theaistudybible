<script lang="ts">
  // @ts-expect-error - No types for svelte-share-buttons-component
  import { Email, Facebook, X } from 'svelte-share-buttons-component';

  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
</script>

<Dialog.Root>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]} class="btn btn-primary">Share</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Share</Dialog.Title>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>

<dialog bind:this={shareModal} class="modal">
  <form method="dialog" class="modal-box flex w-fit flex-col space-y-2">
    <h1 class="text-bold">Share to:</h1>
    <div class="flex place-items-center justify-center space-x-2">
      <Email
        class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
        subject="Response from RevelationsAI"
        body={`${sharableContent}\n\n${url}`}
      />
      <Facebook
        class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
        {url}
        quote={sharableContent}
      />
      <X
        class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
        text={sharableContent}
        {url}
        hashtags="revelationsai,ai,christ,jesus"
      />
    </div>
    <div class="flex place-items-center justify-center space-x-2">
      <label for={`include-message-${id}`}>Include your message</label>
      <input
        tabindex="-1"
        id={`include-message-${id}`}
        type="checkbox"
        class="checkbox checkbox-primary checkbox-sm"
        bind:checked={includePreviousMessage}
      />
    </div>
    <p class="text-xs text-gray-400">Text will also be copied to your clipboard!</p>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
