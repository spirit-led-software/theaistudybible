<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PUBLIC_WEBSITE_URL } from '$env/static/public';
  import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
  import LogoIcon from '$lib/components/branding/LogoIcon.svelte';
  import { SolidLineSpinner } from '$lib/components/loading';
  import Icon from '@iconify/svelte';
  import type { ActionData, SubmitFunction } from './$types';

  export let form: ActionData;

  let isMobile = false;
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
  $: if ($page.url.searchParams.get('mobile') === 'true') {
    isMobile = true;
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

  $: alertMessage && setTimeout(() => (alertMessage = undefined), 8000);
</script>

<svelte:head>
  <title>RevelationsAI: Sign Up</title>
  <meta
    name="description"
    content="Sign up for RevelationsAI. Discover Jesus Christ with the power of AI. Uncover mysteries of the Bible and Christian faith."
  />
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
    <LogoIcon class="mx-auto my-8 rounded-full shadow-xl" />
    <div class="flex w-full flex-col space-y-3 text-center">
      <form class="flex w-full flex-col" method="POST" action="?/social" use:enhance={submit}>
        <input type="hidden" name="mobile" value={isMobile} />
        <input type="hidden" name="provider" value="google" />
        <button
          type="submit"
          class="w-full rounded bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-900 hover:shadow-xl"
        >
          <Icon icon="fa6-brands:google" class="mr-2 inline-block text-white" />
          Continue with Google
        </button>
      </form>
      <form class="flex w-full flex-col" method="POST" action="?/social" use:enhance={submit}>
        <input type="hidden" name="provider" value="apple" />
        <button
          type="submit"
          class="w-full rounded bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-900 hover:shadow-xl"
        >
          <Icon icon="fa6-brands:apple" class="mr-2 inline-block text-white" />
          Continue with Apple
        </button>
      </form>
    </div>
    <div class="divider">OR</div>
    <form class="flex w-full flex-col" method="POST" action="?/email" use:enhance={submit}>
      <input type="hidden" name="mobile" value={isMobile} />
      <input
        id="email"
        name="email"
        type="email"
        class="mb-3 w-full border px-2 py-2 shadow-xl outline-none focus:outline-none"
        placeholder="Email address"
      />
      <PasswordInput id="password" name="password" class="mb-3 w-full shadow-xl" />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        placeholder="Confirm Password"
        class="mb-3 w-full shadow-xl"
      />
      <button
        type="submit"
        class="mb-3 w-full rounded bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-900 hover:shadow-xl"
      >
        Continue with Email
      </button>
      <div class="flex flex-col space-y-1 text-center text-sm text-gray-500">
        <a href="/sign-in" class="hover:underline">Already have an account? Login here.</a>
        <a href={`${PUBLIC_WEBSITE_URL}/privacy-policy`} class="hover:underline">Privacy Policy</a>
      </div>
    </form>
  </div>
</div>
