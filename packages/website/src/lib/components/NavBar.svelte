<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_AUTH_URL } from '$env/static/public';
  import Avatar from '$lib/components/user/Avatar.svelte';
  import Icon from '@iconify/svelte';
  import { isAdmin } from '@revelationsai/client/services/user';
  import type { UserInfo } from '@revelationsai/core/model/user';
  import CompactLogo from './branding/CompactLogo.svelte';
  import Logo from './branding/Logo.svelte';

  export let user: UserInfo | undefined = undefined;

  let isOpen = false;

  const navItems: {
    label: string;
    href: string;
  }[] = [
    {
      label: 'Home',
      href: '/'
    },
    {
      label: 'Chat',
      href: '/chat'
    },
    {
      label: 'Search',
      href: '/search'
    },
    {
      label: 'Devotions',
      href: '/devotions'
    }
  ];

  $: isActive = (path: string) => {
    if (path === '/') return $page.url.pathname === path;
    return $page.url.pathname.startsWith(path);
  };

  $: if (user && isAdmin(user) && !navItems.some((item) => item.label === 'Admin')) {
    navItems.push({
      label: 'Admin',
      href: '/admin'
    });
  }

  $: if ($page.url.pathname) isOpen = false;
</script>

<div
  class={`flex w-full flex-col lg:static lg:z-0 lg:h-fit ${
    isOpen ? 'absolute z-40 h-screen' : 'relative'
  }`}
>
  <nav class="relative flex h-16 items-center justify-between bg-slate-700 px-4 py-4">
    <a href="/" class="lg:hidden">
      <CompactLogo colorscheme="light" />
    </a>
    <a href="/" class="hidden lg:block">
      <Logo size="lg" colorscheme="light" />
    </a>
    <div class="flex place-items-center space-x-1 lg:hidden">
      <div>
        {#if user}
          <div class="flex flex-col place-items-center justify-center space-y-1">
            <a
              href={`${PUBLIC_AUTH_URL}/account?returnPath=${encodeURIComponent(
                $page.url.pathname
              )}`}
            >
              <Avatar size="sm" />
            </a>
          </div>
        {/if}
      </div>
      <button
        class={`flex transform items-center p-3 text-white duration-300 ${
          !isOpen ? 'rotate-180' : ''
        }`}
        on:click|preventDefault={() => (isOpen = !isOpen)}
      >
        <Icon
          icon={isOpen ? 'formkit:down' : 'material-symbols:menu'}
          height={20}
          width={20}
          class={`transition-transform duration-100 ${isOpen ? 'rotate-[360deg]' : 'rotate-0'}`}
        />
      </button>
    </div>
    <ul class="hidden lg:mx-auto lg:flex lg:w-auto lg:items-center lg:space-x-6">
      {#each navItems as navItem}
        <li>
          <a
            class={`block rounded-xl px-6 py-2 text-sm font-medium transition duration-200 ${
              isActive(navItem.href)
                ? 'bg-white text-slate-800 hover:bg-gray-100 active:bg-gray-100'
                : 'bg-transparent text-white hover:bg-gray-800 active:bg-slate-800'
            }`}
            href={navItem.href}
          >
            {navItem.label}
          </a>
        </li>
      {/each}
      <li>
        <a
          class="block rounded-lg bg-blue-300 px-6 py-2 text-sm font-medium hover:bg-blue-400 hover:text-white active:bg-blue-400"
          href={'/upgrade'}
        >
          Upgrade
        </a>
      </li>
    </ul>
    {#if user}
      <div class="hidden place-items-center space-x-2 lg:flex">
        <div class="inline-flex items-center justify-center space-x-1">
          <a
            href={`${PUBLIC_AUTH_URL}/account?returnPath=${encodeURIComponent($page.url.pathname)}`}
          >
            <Avatar size="md" />
          </a>
        </div>
        <a
          href={`${PUBLIC_AUTH_URL}/logout`}
          class="hidden rounded-xl bg-gray-50 px-6 py-2 text-sm font-medium text-gray-900 transition duration-200 hover:bg-gray-200 lg:ml-auto lg:mr-3 lg:inline-block"
        >
          Log Out
        </a>
      </div>
    {:else}
      <a
        class="hidden rounded-xl bg-gray-50 px-6 py-2 text-sm font-medium text-gray-900 transition duration-200 hover:bg-gray-200 lg:ml-auto lg:mr-3 lg:inline-block"
        href={`${PUBLIC_AUTH_URL}/sign-in`}
      >
        Log In
      </a>
    {/if}
  </nav>
  <div
    class={`z-50 flex w-full flex-col bg-white transition-all duration-300 ${
      isOpen ? 'flex-1' : 'hidden'
    } overflow-y-hidden lg:hidden`}
  >
    <nav class="flex h-full w-full flex-col overflow-y-hidden px-6 py-6">
      <div>
        <ul>
          {#each navItems as navItem}
            <li>
              <button
                class={`mb-3 flex w-full rounded-xl px-4 py-3 text-base font-semibold leading-none text-slate-800 hover:bg-slate-200 active:bg-slate-200 ${
                  isActive(navItem.href) ? ' bg-slate-100' : ''
                }`}
                on:click={async () => {
                  if (isActive(navItem.href)) isOpen = false;
                  else await goto(navItem.href);
                }}
              >
                {navItem.label}
              </button>
            </li>
          {/each}
          <li>
            <button
              class="mb-3 flex w-full rounded-xl bg-blue-300 px-4 py-3 text-base font-medium leading-none hover:bg-blue-400 hover:text-white active:bg-blue-400"
              on:click={async () => {
                if (isActive('/upgrade')) isOpen = false;
                else await goto('/upgrade');
              }}
            >
              Upgrade
            </button>
          </li>
        </ul>
      </div>
      <div class="mt-auto">
        <div class="pt-6">
          {#if user}
            <div class="flex w-full flex-col space-y-2">
              <div class="inline-flex items-center justify-center">
                <Avatar size="md" />
                <span class="ml-2 text-sm font-semibold text-gray-800">
                  {user.name || user.email || 'User'}
                </span>
              </div>
              <a
                href={`${PUBLIC_AUTH_URL}/logout`}
                class="mb-3 block rounded-xl bg-gray-50 px-10 py-3 text-center text-xs font-semibold leading-none hover:bg-gray-100"
              >
                Log out
              </a>
            </div>
          {:else}
            <a
              class="mb-3 block rounded-xl bg-gray-50 px-4 py-3 text-center text-xs font-semibold leading-none hover:bg-gray-100"
              href={`${PUBLIC_AUTH_URL}/sign-in`}
            >
              Log in
            </a>
          {/if}
        </div>
      </div>
    </nav>
  </div>
</div>
