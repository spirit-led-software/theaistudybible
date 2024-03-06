<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
  import LogoIcon from '$lib/components/branding/LogoIcon.svelte';
  import { SolidLineSpinner } from '$lib/components/loading';
  import type { ActionData, SubmitFunction } from './$types';

  export let form: ActionData;

  let token: string | undefined = undefined;
  let isLoading = false;
  let alertMessage:
    | {
        type: 'error' | 'success';
        text: string;
      }
    | undefined = undefined;

  const submit: SubmitFunction = () => {
    isLoading = true;
    return async ({ update }) => {
      isLoading = false;
      await update();
    };
  };

  $: if ($page.url.searchParams.get('token')) token = $page.url.searchParams.get('token')!;
  $: if ($page.url.searchParams.get('error')) {
    alertMessage = {
      type: 'error',
      text: $page.url.searchParams.get('error')!
    };
  }
  $: if ($page.url.searchParams.get('success')) {
    alertMessage = {
      type: 'success',
      text: $page.url.searchParams.get('success')!
    };
  }

  $: if (form?.errors?.banner) {
    alertMessage = {
      type: 'error',
      text: form.errors.banner
    };
  }
  $: if (form?.success?.banner) {
    alertMessage = {
      type: 'success',
      text: form.success.banner
    };
  }

  $: if (alertMessage) setTimeout(() => (alertMessage = undefined), 10000);
</script>

<svelte:head>
  <title>Forgot Password</title>
  <meta name="description" content="RevelationsAI Forgot Password" />
</svelte:head>

<div
  class="relative flex w-full flex-col bg-white px-5 pb-10 pt-3 shadow-xl sm:w-2/3 md:w-1/2 lg:h-full lg:w-1/3 lg:place-content-center lg:px-20"
>
  {#if isLoading}
    <div class="absolute -top-20 left-0 right-0 flex place-items-center justify-center lg:top-20">
      <SolidLineSpinner size="md" colorscheme={'dark'} />
    </div>
  {/if}
  {#if alertMessage}
    <div class="absolute -top-20 left-0 right-0 flex place-items-center justify-center lg:top-20">
      <div
        class={`mx-auto w-5/6 rounded-xl px-4 py-2 text-center text-white lg:text-xl ${
          alertMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}
      >
        {alertMessage.text}
      </div>
    </div>
  {/if}
  <div class="flex flex-col">
    <LogoIcon class="mx-auto my-4 rounded-full shadow-xl" />
    <div class="divide-y divide-gray-600">
      {#if token}
        <form
          class="flex w-full flex-col space-y-3 pt-4"
          method="post"
          action="?/reset"
          use:enhance={submit}
        >
          <input id="token" name="token" type="hidden" value={token} />
          <PasswordInput
            id="password"
            name="password"
            placeholder="New Password"
            class="w-full shadow-xl"
          />
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm New Password"
            class="w-full shadow-xl"
          />
          <button
            type="submit"
            class="w-full rounded bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-900 hover:shadow-xl"
          >
            Reset Password
          </button>
        </form>
      {:else}
        <form
          class="flex w-full flex-col space-y-3 pt-4"
          method="post"
          action="?/forgot"
          use:enhance={submit}
        >
          <input
            id="email"
            name="email"
            type="email"
            class="w-full border px-2 py-2 shadow-xl outline-none focus:outline-none"
            placeholder="Email address"
          />
          <button
            type="submit"
            class="w-full rounded bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-900 hover:shadow-xl"
          >
            Enter your email
          </button>
          <div class="flex justify-between text-sm text-gray-500">
            <a href="/sign-in" class="hover:underline">Know your password? Login here.</a>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
