<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { SolidLineSpinner } from '$lib/components/loading';
	import { session } from '$lib/stores/user';
	import { useQueryClient } from '@tanstack/svelte-query';
	import type { EventHandler } from 'svelte/elements';

	let alert: { type: 'error' | 'success'; message: string } | undefined = undefined;
	let isLoading = false;

	const queryClient = useQueryClient();

	const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
		const formData = new FormData(event.currentTarget);
		const name = formData.get('name') as string;
		const url = formData.get('url') as string;
		const pathRegex = formData.get('pathRegex') as string;

		if (!name || !url) {
			alert = { type: 'error', message: 'Please fill out all fields' };
			return;
		}
		try {
			isLoading = true;
			const response = await fetch(`${PUBLIC_API_URL}/scraper/website`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$session}`
				},
				body: JSON.stringify({ name, url, pathRegex })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Something went wrong');
			}

			alert = { type: 'success', message: 'Successfully started website index.' };
		} catch (e: any) {
			console.error(e);
			alert = { type: 'error', message: e.message };
		} finally {
			await queryClient.invalidateQueries(['index-operations']);
			isLoading = false;
		}
	};

	$: if (alert) setTimeout(() => (alert = undefined), 8000);
</script>

<svelte:head>
	<title>Admin: Index Website</title>
</svelte:head>

<form class="relative flex-col w-full" on:submit|preventDefault={handleSubmit}>
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
		<h1 class="text-xl font-medium">Index Website</h1>
		<div class="flex flex-col">
			<input
				id="name"
				name="name"
				type="text"
				placeholder="Name"
				class="w-full p-2 border border-gray-300 rounded-md"
			/>
		</div>
		<div class="flex flex-col">
			<input
				id="url"
				name="url"
				type="text"
				placeholder="URL"
				class="w-full p-2 border border-gray-300 rounded-md"
			/>
		</div>
		<div class="flex flex-col">
			<input
				id="pathRegex"
				name="pathRegex"
				type="text"
				placeholder="Path Regular Expression"
				class="w-full p-2 border border-gray-300 rounded-md"
			/>
			<div class="inline-flex space-x-2">
				<label for="file" class="text-gray-400 text-2xs">
					Example: <span class="text-gray-600">bible-commentary\/.*</span>
				</label>
				<label for="file" class="text-gray-400 text-2xs">
					Cannot start with <span class="text-gray-600">/</span> or{' '}
					<span class="text-gray-600">\/</span>
				</label>
			</div>
		</div>
	</div>
	<div class="w-full">
		<button type="submit" class="w-full p-2 mt-4 text-white bg-blue-300 rounded-md">
			Submit
		</button>
	</div>
</form>
