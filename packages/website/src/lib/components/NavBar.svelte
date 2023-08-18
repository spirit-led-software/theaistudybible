<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/components/branding/Logo.svelte';
	import Avatar from '$lib/components/user/Avatar.svelte';
	import type { UserWithRoles } from '@core/model';
	import Icon from '@iconify/svelte';

	export let user: UserWithRoles | undefined = undefined;

	type NavItem = {
		label: string;
		href: string;
	};

	const navItems: NavItem[] = [
		{
			label: 'Home',
			href: '/'
		},
		{
			label: 'Chat',
			href: '/chat'
		},
		{
			label: 'Devotions',
			href: '/devotions'
		}
	];

	const isActive = (path: string) => {
		if (path === '/') return $page.url.pathname === path;
		return $page.url.pathname.startsWith(path);
	};

	let isOpen = false;

	$: if ($page.route) isOpen = false;
</script>

<div class="flex flex-col">
	<nav class="relative flex items-center justify-between h-16 px-4 py-4 bg-slate-700">
		<a href="/">
			<Logo size="2xl" colorscheme="light" />
		</a>
		<div class="lg:hidden">
			<button
				class={`flex items-center p-3 text-white duration-300 transform ${
					!isOpen ? 'rotate-180' : ''
				}`}
				on:click|preventDefault={() => (isOpen = !isOpen)}
			>
				{#if isOpen}
					<Icon icon="formkit:down" height={20} width={20} />
				{:else}
					<Icon icon="material-symbols:menu" />
				{/if}
			</button>
		</div>
		<ul
			class="absolute hidden transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 lg:flex lg:mx-auto lg:items-center lg:w-auto lg:space-x-6"
		>
			{#each navItems as navItem}
				<li>
					<a
						class={`block px-6 py-2 text-sm font-bold transition duration-200 rounded-xl ${
							isActive(navItem.href)
								? 'bg-white text-slate-800 hover:bg-gray-100 hover:text-slate-900'
								: 'bg-transparent text-white hover:bg-gray-800 hover:text-white'
						}`}
						href={navItem.href}
					>
						{navItem.label}
					</a>
				</li>
			{/each}
			<li>
				<a
					class="block px-6 py-2 text-sm font-extrabold text-white bg-blue-300 rounded-lg hover:bg-blue-400"
					href={'/upgrade'}
				>
					Upgrade
				</a>
			</li>
		</ul>
		{#if user}
			<div class="hidden space-x-2 lg:flex">
				<div class="inline-flex items-center justify-center space-x-1">
					<Avatar {user} size="sm" />
				</div>
				<a
					href="/auth/logout"
					class="hidden px-6 py-2 text-sm font-bold text-gray-900 transition duration-200 lg:inline-block lg:ml-auto lg:mr-3 bg-gray-50 hover:bg-gray-200 rounded-xl"
				>
					Log Out
				</a>
			</div>
		{:else}
			<a
				class="hidden px-6 py-2 text-sm font-bold text-gray-900 transition duration-200 lg:inline-block lg:ml-auto lg:mr-3 bg-gray-50 hover:bg-gray-200 rounded-xl"
				href="/auth/login"
			>
				Log In
			</a>
		{/if}
	</nav>
	<div
		class={`fixed z-50 bottom-0 left-0 flex flex-col w-full  bg-white border-r md:w-1/2 top-16 transition-all duration-300 ${
			isOpen ? 'h-100' : 'h-0'
		} overflow-y-hidden lg:hidden`}
	>
		<nav
			class={`flex flex-col h-full w-full px-6 py-6 overflow-y-hidden transition duration-300 ease-in-out ${
				isOpen ? '' : '-top-full'
			}`}
		>
			<div>
				<ul>
					{#each navItems as navItem}
						<li>
							<a
								class={`block px-4 py-3 mb-3 text-md font-semibold leading-none rounded-xl ${
									isActive(navItem.href)
										? 'text-slate-800 bg-slate-200'
										: 'text-gray-600 hover:bg-gray-100'
								}`}
								href={navItem.href}
							>
								{navItem.label}
							</a>
						</li>
					{/each}
					<li>
						<a
							class="block px-4 py-3 mb-3 font-extrabold leading-none text-white bg-blue-300 rounded-xl text-md hover:bg-blue-400"
							href={'/upgrade'}
						>
							Upgrade
						</a>
					</li>
				</ul>
			</div>
			<div class="mt-auto">
				<div class="pt-6">
					{#if user}
						<div class="flex flex-col w-full space-y-2">
							<div class="inline-flex items-center justify-center">
								<Avatar {user} size="sm" />
								<span class="ml-2 text-sm font-semibold text-gray-800">
									{user.email ?? 'User'}
								</span>
							</div>
							<a
								href="/auth/logout"
								class="block px-10 py-3 mb-3 text-xs font-semibold leading-none text-center bg-gray-50 hover:bg-gray-100 rounded-xl"
							>
								Log out
							</a>
						</div>
					{:else}
						<a
							class="block px-4 py-3 mb-3 text-xs font-semibold leading-none text-center bg-gray-50 hover:bg-gray-100 rounded-xl"
							href="/auth/login"
						>
							Log in
						</a>
					{/if}
				</div>
				<p class="my-4 text-xs text-center text-gray-400">
					<span>Copyright © 2023</span>
				</p>
			</div>
		</nav>
	</div>
</div>
