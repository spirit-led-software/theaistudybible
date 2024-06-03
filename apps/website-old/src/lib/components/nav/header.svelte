<script lang="ts">
  import { resolvedTailwindConfig } from '$lib/theme/tailwind';
  import { dark } from '@clerk/themes';
  import ClerkLoading from 'clerk-sveltekit/client/ClerkLoading.svelte';
  import SignInButton from 'clerk-sveltekit/client/SignInButton.svelte';
  import SignedIn from 'clerk-sveltekit/client/SignedIn.svelte';
  import SignedOut from 'clerk-sveltekit/client/SignedOut.svelte';
  import UserButton from 'clerk-sveltekit/client/UserButton.svelte';
  import { mode } from 'mode-watcher';
  import { Circle } from 'svelte-loading-spinners';
  import LogoSmall from '../branding/logo-small.svelte';
  import Logo from '../branding/logo.svelte';
  import { Button } from '../ui/button';
  import NavigationDrawer from './drawer.svelte';

  let innerWidth = $state<number>(0);

  let smallWindow = $derived(
    innerWidth < parseInt(resolvedTailwindConfig.theme.screens.md.split('px')[0])
  );
</script>

<svelte:window bind:innerWidth />

<header class="flex h-20 items-center justify-between border-b border-b-border py-6 pl-2 pr-4">
  <div class="flex w-1/3 justify-start md:hidden">
    <NavigationDrawer />
  </div>
  <div class="flex w-1/3 justify-center md:justify-start">
    <a href="/">
      {#if smallWindow}
        <LogoSmall width={128} height={64} />
      {:else}
        <Logo width={256} height={64} />
      {/if}
    </a>
  </div>
  <div class="hidden w-1/3 justify-center md:flex">
    <a href="/bible" class="text-foreground">Bible</a>
  </div>
  <div class="flex w-1/3 justify-end">
    <SignedIn>
      <UserButton
        showName={!smallWindow}
        appearance={{
          baseTheme: $mode === 'dark' ? dark : undefined,
          elements: {
            userButtonOuterIdentifier: 'text-foreground'
          }
        }}
      />
    </SignedIn>
    <SignedOut>
      <Button>
        <SignInButton />
      </Button>
    </SignedOut>
    <ClerkLoading>
      <Circle size={20} color="hsl(var(--foreground))" />
    </ClerkLoading>
  </div>
</header>
