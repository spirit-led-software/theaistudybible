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
		const metadata = formData.get('metadata') as string;

		if (!name || !url) {
			alert = { type: 'error', message: 'Please fill out all fields' };
			return;
		}

		if (metadata) {
			try {
				JSON.parse(metadata);
			} catch (e) {
				alert = { type: 'error', message: 'Metadata must be valid JSON' };
				return;
			}
		}

		try {
			isLoading = true;
			const response = await fetch(`${PUBLIC_API_URL}/scraper/webpage`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$session}`
				},
				body: JSON.stringify({ name, url, metadata })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Something went wrong');
			}

			alert = { type: 'success', message: 'Successfully started webpage index.' };
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
	<title>Admin: Index Webpage</title>
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
		<h1 class="text-xl font-medium">Index Webpage</h1>
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
		<div class="flex flex-col space-y-1">
			<textarea
				id="metadata"
				name="metadata"
				placeholder="Metadata (JSON)"
				rows="4"
				class="w-full p-2 border border-gray-300 rounded-md"
			/>
		</div>
	</div>
	<div class="w-full">
		<button type="submit" class="w-full p-2 mt-4 text-white bg-blue-300 rounded-md">
			Submit
		</button>
	</div>
</form>
