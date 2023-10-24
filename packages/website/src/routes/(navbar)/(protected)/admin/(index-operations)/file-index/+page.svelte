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
		const file = formData.get('file') as File;
		const name = formData.get('name') as string;
		const url = formData.get('url') as string;

		if (!file || !name || !url) {
			alert = { type: 'error', message: 'Please fill out all fields' };
			return;
		}

		try {
			isLoading = true;
			const getUrlResponse = await fetch(`${PUBLIC_API_URL}/scraper/file/presigned-url`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$session}`
				},
				body: JSON.stringify({ name, url, fileType: file.type, fileName: file.name })
			});

			if (!getUrlResponse.ok) {
				const data = await getUrlResponse.json();
				throw new Error(data.error ?? 'Something went wrong');
			}

			const { url: presignedUrl } = await getUrlResponse.json();

			const uploadResponse = await fetch(presignedUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': file.type
				},
				body: file
			});

			if (!uploadResponse.ok) {
				console.error(
					`Error uploading to s3: ${uploadResponse.status} ${uploadResponse.statusText}`
				);
				throw new Error('Something went wrong while uploading the file');
			}

			alert = { type: 'success', message: 'Successfully uploaded file' };
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
	<title>Admin: Index File</title>
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
