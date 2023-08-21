<script lang="ts">
	import { enhance } from '$app/forms';
	import { SolidLineSpinner } from '$lib/components/loading';
	import type { ActionData, SubmitFunction } from './$types';

	export let form: ActionData;

	let alert: { type: 'error' | 'success'; message: string } | undefined = undefined;
	let isLoading = false;

	const submit: SubmitFunction = () => {
		isLoading = true;

		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};

	$: if (form?.error?.banner) {
		alert = { type: 'error', message: form.error.banner };
	}
	$: if (form?.success?.banner) {
		alert = { type: 'success', message: form.success.banner };
	}

	$: if (alert) setTimeout(() => (alert = undefined), 8000);
</script>

<form class="relative flex-col w-full" method="post" use:enhance={submit}>
	{#if isLoading}
		<div class="absolute left-0 right-0 flex justify-center">
			<SolidLineSpinner size="md" colorscheme={'dark'} />
		</div>
	{/if}
	{#if alert}
		<div class={`absolute left-0 right-0 flex justify-center`}>
			<div
				class={`px-5 mx-auto text-xl rounded-lg outline text-white ${
					alert?.type === 'error' ? 'bg-red-500' : 'bg-green-500'
				}`}
			>
				{alert?.message}
			</div>
		</div>
	{/if}
	<div class="flex flex-col space-y-2">
		<h1 class="text-xl font-medium">Index File</h1>
		<div class="flex justify-between w-full space-x-2">
			<div class="flex w-1/2 h-12">
				<input
					id="file"
					name="file"
					type="file"
					placeholder="File"
					class="w-full h-full p-2 border border-gray-300 rounded-md"
				/>
			</div>
			<div class="flex w-1/2 h-12">
				<input
					id="name"
					name="name"
					type="text"
					placeholder="Name"
					class="w-full h-full p-2 border border-gray-300 rounded-md"
				/>
			</div>
		</div>
		<div class="flex flex-col space-y-1">
			<input
				id="url"
				name="url"
				type="text"
				placeholder="URL"
				class="w-full p-2 border border-gray-300 rounded-md"
			/>
		</div>
		<div class="w-full">
			<button type="submit" class="w-full p-2 text-white bg-blue-300 rounded-md"> Submit </button>
		</div>
	</div>
</form>
