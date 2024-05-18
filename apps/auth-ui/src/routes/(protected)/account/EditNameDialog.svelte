<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { session, user } from '$lib/stores/user';
  import { updateUser } from '@revelationsai/client/services/user';
  import type { EventHandler } from 'svelte/elements';

  export const show = () => {
    dialog?.showModal();
  };

  let dialog: HTMLDialogElement | undefined = undefined;

  let isLoading = false;
  let alert: {
    type: 'success' | 'error';
    message: string;
  } | null = null;
  let errors: {
    [key: string]: string;
  }[] = [];

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    const formData = new FormData(event.currentTarget);
    const data: {
      name?: string;
    } = Object.fromEntries(formData.entries());
    console.log(data);

    isLoading = true;
    errors = [];
    try {
      if (!data.name) {
        errors.push({
          name: 'Name is required.'
        });
      }
      if (errors.length > 0) {
        return;
      }

      await updateUser(
        $user!.id,
        {
          name: data.name
        },
        {
          session: $session!
        }
      );
      await invalidateAll();

      alert = {
        type: 'success',
        message: 'Name updated successfully.'
      };

      event.currentTarget.reset();
      setTimeout(() => {
        dialog?.close();
      }, 1000);
    } catch (error) {
      console.error("Couldn't update user", error);
      if (error instanceof Error) {
        alert = {
          type: 'error',
          message: error.message
        };
      } else {
        alert = {
          type: 'error',
          message: 'An unknown error occurred.'
        };
      }
    } finally {
      isLoading = false;
    }
  };
</script>

<dialog bind:this={dialog} class="modal">
  <form on:submit|preventDefault={handleSubmit} class="modal-box space-y-4 p-10">
    {#if alert}
      <div class={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
        {alert.message}
      </div>
    {/if}
    <h2 class="text-xl font-medium">Edit Name</h2>
    <div class="flex flex-col space-y-2">
      <label for="name">Name</label>
      <input type="text" name="name" id="name" class="input input-bordered" />
      {#if errors.find((error) => error.name)}
        <div class="text-error text-xs">
          {errors.find((error) => error.name)?.name}
        </div>
      {/if}
      <button type="submit" class="btn btn-primary w-full">
        {#if isLoading}
          <span class="loading loading-spinner" />
        {:else}
          Save
        {/if}
      </button>
      <form method="dialog" class="flex justify-end space-x-2">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">x</button>
      </form>
    </div>
  </form>
</dialog>
