<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	let isOpen = false;
	let activePath: string | undefined = undefined;
	let loadingToolHref: string | undefined = undefined;

	const tools: {
		name: string;
		icon: string;
		href: string;
	}[] = [
		{
			name: 'Users',
			icon: 'mdi:account',
			href: '/admin/users'
		},
		{
			name: 'Data Sources',
			icon: 'mdi:database-search',
			href: '/admin/data-sources'
		},
		{
			name: 'Index Operations',
			icon: 'mdi:database',
			href: '/admin/index-operations'
		},
		{
			name: 'Chats',
			icon: 'mdi:chat',
			href: '/admin/chats'
		},
		{
			name: 'Devo Reactions',
			icon: 'mdi:heart',
			href: '/admin/reactions/devotion'
		},
		{
			name: 'Response Reactions',
			icon: 'mdi:heart',
			href: '/admin/reactions/ai-response'
		}
	];

	$: if ($page.url.pathname) {
		activePath = $page.url.pathname;
		isOpen = false;
		loadingToolHref = undefined;
	}
</script>

<nav
	class={`absolute z-30 flex h-full flex-shrink-0 flex-grow-0 border-t-2 bg-slate-700 duration-300 lg:static lg:w-1/4 ${
		isOpen ? 'w-full' : 'w-0'
	}`}
>
	<div class="relative flex h-full w-full flex-col">
		<button
			class={`absolute top-2 z-40 cursor-pointer rounded-full border border-slate-700 bg-white p-1 duration-300 lg:hidden ${
				isOpen ? 'right-2 rotate-0' : '-right-10 rotate-180 opacity-75'
			}`}
			on:click|preventDefault={() => (isOpen = !isOpen)}
		>
			<Icon icon="formkit:arrowleft" height={20} width={20} />
		</button>
		<div
			class={`h-full w-full overflow-y-auto px-3 py-4 text-white lg:visible lg:px-6 ${
				isOpen ? 'visible' : 'invisible'
			}`}
		>
			<h1 class="mb-3 px-2 text-2xl font-medium">Admin Utilities</h1>
			<div class="flex w-full flex-col justify-center space-y-3">
				{#each tools as tool}
					<div
						class={`flex w-full place-items-center justify-between rounded-lg px-4 py-2 hover:bg-slate-900 active:bg-slate-900 ${
							activePath?.startsWith(tool.href) ? 'bg-slate-800' : ''
						}`}
					>
						<a
							href={tool.href}
							class="flex w-5/6"
							on:click={() => {
								if (activePath === tool.href) {
									isOpen = false;
									return;
								}
								loadingToolHref = tool.href;
							}}
						>
							<Icon icon={tool.icon} class="mr-2 text-xl" />
							{tool.name}
						</a>
						<div class="flex place-items-center justify-center">
							{#if loadingToolHref === tool.href}
								<div class="flex place-items-center justify-center">
									<span class="loading loading-spinner loading-xs" />
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</nav>
