<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { updateDataSource } from '$lib/services/data-source';
	import { session } from '$lib/stores/user';
	import type { DataSource } from '@core/model';
	import { dataSources as dataSourcesTable } from '@core/schema';
	import { createMutation, useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
	import type { EventHandler } from 'svelte/elements';

	export let dataSource: DataSource;

	export const show = () => {
		editDialog?.showModal();
	};

	let isLoading = false;
	let editDialog: HTMLDialogElement | undefined = undefined;

	const client = useQueryClient();

	const handleUpdate = async ({
		url,
		syncSchedule,
		metadata = {}
	}: {
		url: string;
		syncSchedule: string;
		metadata: object;
	}) => {
		return await updateDataSource(
			dataSource.id,
			{
				url,
				syncSchedule: syncSchedule as any,
				metadata
			},
			{
				session: $session!
			}
		);
	};

	const editDataSourceMutation = createMutation({
		mutationFn: handleUpdate,
		onMutate: async (input) => {
			await client.cancelQueries(['infinite-data-sources']);
			const previousDataSources = client.getQueryData<InfiniteData<DataSource[]>>([
				'infinite-data-sources'
			]);
			if (previousDataSources) {
				client.setQueryData<InfiniteData<DataSource[]>>(['infinite-data-sources'], {
					pages: previousDataSources.pages.map((page) =>
						page.map((c) => (c.id === dataSource.id ? { ...c, ...(input as any) } : c))
					),
					pageParams: previousDataSources.pageParams
				});
			}
			return { previousDataSources };
		},
		onSettled: async () => {
			await client.invalidateQueries(['infinite-data-sources']);
		}
	});

	const handleSubmitEdit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
		const formData = new FormData(event.currentTarget);
		const url = (formData.get('url') || undefined) as string | undefined;
		const file = (formData.get('file') || undefined) as File | undefined;
		const pathRegex = (formData.get('pathRegex') || undefined) as string | undefined;
		const title = (formData.get('title') || undefined) as string | undefined;
		const author = (formData.get('author') || undefined) as string | undefined;
		const category = (formData.get('category') || undefined) as string | undefined;
		const metadataString = (formData.get('metadata') || undefined) as string | undefined;
		let syncSchedule = (formData.get('syncSchedule') || undefined) as string | undefined;

		if (!url) {
			alert('Missing required field "URL"');
			return;
		}

		if (dataSource.type === 'FILE' && !file) {
			alert('Missing required field "file"');
			return;
		}

		if (dataSource.type === 'WEB_CRAWL' && !pathRegex) {
			alert('Missing required field "pathRegex"');
			return;
		}

		if (!syncSchedule) {
			syncSchedule = 'NEVER';
		}

		let metadata = {};
		if (metadataString) {
			try {
				metadata = JSON.parse(metadataString);
			} catch (e) {
				alert('Invalid JSON');
				return;
			}
		}

		let isLoading = true;
		try {
			$editDataSourceMutation.mutate({
				url,
				syncSchedule,
				metadata: {
					...metadata,
					category,
					title,
					author
				}
			});

			if (file && file.size > 0) {
				const getUrlResponse = await fetch(`${PUBLIC_API_URL}/scraper/file/presigned-url`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${$session}`
					},
					body: JSON.stringify({
						name: dataSource.name,
						url,
						fileType: file.type,
						fileName: file.name,
						metadata: JSON.stringify(metadata),
						dataSourceId: dataSource.id
					})
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
					throw new Error('Something went wrong while uploading the file to S3');
				}
			}

			editDialog?.close();
		} catch (e: any) {
			alert(e.message);
		} finally {
			isLoading = false;
		}
	};
</script>

<dialog bind:this={editDialog} class="modal">
	<form on:submit={handleSubmitEdit} class="p-10 space-y-2 modal-box">
		<h1 class="mb-2 text-2xl font-medium">Edit Data Source</h1>
		<input
			id="url"
			type="url"
			name="url"
			placeholder="URL*"
			class="w-full input input-bordered"
			required
			value={dataSource.url}
		/>
		{#if dataSource.type === 'FILE'}
			<input
				type="file"
				name="file"
				placeholder="File*"
				class="w-full file-input file-input-bordered"
				required
			/>
		{/if}
		{#if dataSource.type === 'FILE' || dataSource.type === 'REMOTE_FILE'}
			<input
				type="text"
				name="title"
				placeholder="Title"
				value={dataSource.metadata.title ?? ''}
				class="w-full input input-bordered"
			/>
			<input
				type="text"
				name="author"
				placeholder="Author"
				value={dataSource.metadata.author ?? ''}
				class="w-full input input-bordered"
			/>
		{/if}
		{#if dataSource.type === 'WEB_CRAWL'}
			<input
				type="text"
				name="pathRegex"
				placeholder="Path Regex*"
				value={dataSource.metadata.pathRegex ?? ''}
				class="w-full input input-bordered"
				required
			/>
		{/if}
		<input
			type="text"
			name="category"
			placeholder="Category"
			value={dataSource.metadata.category ?? ''}
			class="w-full input input-bordered"
		/>
		<textarea
			name="metadata"
			placeholder="Additional Metadata"
			value={JSON.stringify(dataSource.metadata, null, 4)}
			class="w-full textarea textarea-bordered"
		/>
		{#if dataSource.type !== 'FILE'}
			<select class="w-full select" name="syncSchedule">
				<option disabled>Sync Schedule</option>
				{#each dataSourcesTable.syncSchedule.enumValues as syncSchedule}
					<option selected={syncSchedule === dataSource.syncSchedule}>{syncSchedule}</option>
				{/each}
			</select>
		{/if}
		<button type="submit" class="w-full btn btn-primary" disabled={isLoading}>
			{#if isLoading}
				<span class="loading loading-spinner" />
			{:else}
				Update
			{/if}
		</button>
		<form method="dialog" class="flex justify-end space-x-2">
			<button class="absolute btn btn-sm btn-circle btn-ghost right-2 top-2" disabled={isLoading}>
				x
			</button>
		</form>
	</form>
</dialog>
