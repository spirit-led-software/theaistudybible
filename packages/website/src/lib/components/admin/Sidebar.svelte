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
			name: 'Index File',
			icon: 'mdi:file-find',
			href: '/admin/file-index'
		},
		{
			name: 'Index Website',
			icon: 'mdi:web',
			href: '/admin/website-index'
		},
		{
			name: 'Index Webpage',
			icon: 'mdi:web',
			href: '/admin/webpage-index'
		}
	];

	$: if ($page.url.pathname) {
		activePath = $page.url.pathname;
		isOpen = false;
		loadingToolHref = undefined;
	}
</script>

<div
	class={`absolute flex h-full max-h-full bg-slate-700 border-t-2 duration-300 z-30 lg:w-1/4 lg:static ${
		isOpen ? 'w-full' : 'w-0'
	}`}
>
	<div class="relative flex flex-col w-full h-full">
		<button
			class={`absolute top-2 p-1 z-40 rounded-full bg-white border border-slate-700 cursor-pointer duration-300 lg:hidden ${
				isOpen ? 'rotate-0 right-2' : 'rotate-180 -right-10 opacity-75'
			}`}
			on:click|preventDefault={() => (isOpen = !isOpen)}
		>
			<Icon icon="formkit:arrowleft" height={20} width={20} />
		</button>
		<div
			class={`h-full w-full overflow-y-scroll py-4 px-3 text-white lg:px-6 lg:visible ${
				isOpen ? 'visible' : 'invisible'
			}`}
		>
			<h1 class="px-2 mb-3 text-2xl font-medium">Admin Utilities</h1>
			<div class="flex flex-col justify-center w-full space-y-3">
				{#each tools as tool}
					<div
						class={`flex w-full place-items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-900 active:bg-slate-900 ${
							activePath === tool.href ? 'bg-slate-800' : ''
						}`}
					>
						<a
							href={tool.href}
							class="flex w-5/6"
							on:click={() => {
								loadingToolHref = tool.href;
							}}
						>
							<Icon icon={tool.icon} class="mr-2 text-xl" />
							{tool.name}
						</a>
						<div class="flex justify-center place-items-center">
							{#if loadingToolHref === tool.href}
								<div class="flex justify-center place-items-center">
									<span class="loading loading-spinner loading-xs" />
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
