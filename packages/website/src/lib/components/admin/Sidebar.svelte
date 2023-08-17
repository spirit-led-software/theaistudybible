<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	let isOpen = false;

	const tools: {
		name: string;
		icon: string;
		route: string;
	}[] = [
		{
			name: 'Index Files',
			icon: 'mdi:file-find',
			route: '/admin/file-index'
		}
	];
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
			<Icon icon="formkit:arrowleft" class="text-xl" />
		</button>
		<div
			class={`h-full w-full overflow-y-scroll py-4 px-3 text-white lg:px-6 lg:visible ${
				isOpen ? 'visible' : 'invisible'
			}`}
		>
			<h1 class="px-2 mb-3 text-2xl font-bold">Admin Utilities</h1>
			<div class="flex flex-col content-center w-full space-y-2">
				<div class="flex justify-center w-full">
					{#each tools as tool}
						<div class={`flex hover:bg-slate-900 ${$page.url.pathname === tool.route}`}>
							<Icon icon={tool.icon} class="text-xl" />
							<a href={tool.route}>{tool.name}</a>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
