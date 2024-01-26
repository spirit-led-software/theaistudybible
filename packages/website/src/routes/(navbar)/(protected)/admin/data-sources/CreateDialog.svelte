<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { createDataSource } from '$lib/services/admin/data-source';
	import { session } from '$lib/stores/user';
	import { dataSources as dataSourcesTable } from '@revelationsai/core/database/schema';
	import type { DataSource } from '@revelationsai/core/model/data-source';
	import { createMutation, useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
	import type { EventHandler } from 'svelte/elements';
	import { v4 as uuidV4 } from 'uuid';

	export let createDialog: HTMLDialogElement | undefined = undefined;

	export const show = () => {
		createDialog?.showModal();
	};

	let isLoading = false;
	let typeSelect: HTMLSelectElement | undefined = undefined;
	let typeSelection: string | undefined = undefined;

	let nameInput: HTMLInputElement | undefined = undefined;
	let titleInput: HTMLInputElement | undefined = undefined;
	let authorInput: HTMLInputElement | undefined = undefined;

	const client = useQueryClient();

	const handleCreate = async ({
		id,
		name,
		url,
		type,
		syncSchedule,
		metadata
	}: {
		id: string;
		name: string;
		url: string;
		type: DataSource['type'];
		syncSchedule: DataSource['syncSchedule'];
		metadata: object;
	}) => {
		return await createDataSource(
			{
				id,
				type: type,
				name,
				url,
				syncSchedule: syncSchedule,
				metadata
			},
			{
				session: $session!
			}
		);
	};

	const createDataSourceMutation = createMutation({
		mutationFn: handleCreate,
		onMutate: async (input) => {
			await client.cancelQueries({ queryKey: ['infinite-data-sources'] });
			const previousDataSources = client.getQueryData<InfiniteData<DataSource[]>>([
				'infinite-data-sources'
			]);
			if (previousDataSources) {
				client.setQueryData<InfiniteData<DataSource[]>>(['infinite-data-sources'], {
					pages: [
						[
							{
								id: input.id,
								name: input.name,
								createdAt: new Date(),
								updatedAt: new Date(),
								metadata: input.metadata,
								numberOfDocuments: 0,
								syncSchedule: input.syncSchedule,
								type: input.type,
								url: input.url,
								lastManualSync: null,
								lastAutomaticSync: null
							},
							...previousDataSources.pages[0]
						],
						...previousDataSources.pages.slice(1)
					],
					pageParams: previousDataSources.pageParams
				});
			}
			return { previousDataSources };
		},
		onSettled: () => {
			client.invalidateQueries({ queryKey: ['infinite-data-sources'] });
		}
	});

	const handleSubmitCreate: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
		const formData = new FormData(event.currentTarget);
		const name = (formData.get('name') || undefined) as string | undefined;
		const url = (formData.get('url') || undefined) as string | undefined;
		const type = (formData.get('type') || undefined) as DataSource['type'] | undefined;
		const file = (formData.get('file') || undefined) as File | undefined;
		const pathRegex = (formData.get('pathRegex') || undefined) as string | undefined;
		const title = (formData.get('title') || undefined) as string | undefined;
		const author = (formData.get('author') || undefined) as string | undefined;
		const category = (formData.get('category') || undefined) as string | undefined;
		const metadataString = (formData.get('metadata') || undefined) as string | undefined;
		let syncSchedule = (formData.get('syncSchedule') || undefined) as
			| DataSource['syncSchedule']
			| undefined;

		if (!name || !url || !type) {
			alert('Missing required fields "name", "url", or "type"');
			return;
		}

		if (type === 'FILE' && !file) {
			alert('Missing required field "file"');
			return;
		}

		if (type === 'WEB_CRAWL' && !pathRegex) {
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
				alert(
					`Invalid JSON in "metadata" field:\n${e instanceof Error ? e.message : JSON.stringify(e)}`
				);
				return;
			}
		}

		const dataSourceId = uuidV4();
		isLoading = true;
		try {
			$createDataSourceMutation.mutate({
				id: dataSourceId,
				name,
				url,
				type,
				syncSchedule,
				metadata: {
					...metadata,
					category,
					title,
					author,
					pathRegex
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
						name,
						url,
						fileType: file.type,
						fileName: file.name,
						metadata: JSON.stringify(metadata),
						dataSourceId
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

			createDialog?.close();
			event.currentTarget.reset();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Unknown error');
		} finally {
			isLoading = false;
		}
	};

	$: if (typeSelect) {
		typeSelect.addEventListener('change', () => {
			typeSelection = typeSelect?.value;
		});
	}
</script>

<dialog bind:this={createDialog} class="modal">
	<form on:submit|preventDefault={handleSubmitCreate} class="p-10 space-y-2 modal-box">
		<select name="type" class="w-full select" bind:this={typeSelect} required>
			<option disabled selected>Type *</option>
			{#each dataSourcesTable.type.enumValues as type}
				<option>{type}</option>
			{/each}
		</select>
		{#if typeSelection != 'Type' && typeSelection !== undefined}
			<input
				type="text"
				name="name"
				placeholder="Name*"
				class="w-full input input-bordered"
				required
				bind:this={nameInput}
				on:focusout={() => {
					const parts = nameInput?.value.split('by') ?? [];
					if (parts.length < 2) {
						return;
					}

					if (titleInput) {
						titleInput.value = titleInput.value || parts[0].replaceAll(/"/g, '').trim();
					}
					if (authorInput) {
						authorInput.value = authorInput.value || parts[1].trim();
					}
				}}
			/>
			<input
				type="url"
				name="url"
				placeholder="URL*"
				class="w-full input input-bordered"
				required
			/>
			{#if typeSelection === 'FILE' || typeSelection === 'REMOTE_FILE' || typeSelection === 'YOUTUBE'}
				<input
					type="text"
					name="title"
					placeholder="Title"
					class="w-full input input-bordered"
					bind:this={titleInput}
				/>
				<input
					type="text"
					name="author"
					placeholder="Author"
					class="w-full input input-bordered"
					bind:this={authorInput}
				/>
			{/if}
			{#if typeSelection === 'FILE'}
				<input
					type="file"
					name="file"
					placeholder="File*"
					class="w-full file-input file-input-bordered"
					required
				/>
			{/if}
			{#if typeSelection === 'WEB_CRAWL'}
				<input
					type="text"
					name="pathRegex"
					placeholder="Path Regex*"
					class="w-full input input-bordered"
					required
				/>
			{/if}
			<input
				type="text"
				name="category"
				placeholder="Category"
				class="w-full input input-bordered"
			/>
			<textarea
				name="metadata"
				placeholder="Additional Metadata"
				class="w-full textarea textarea-bordered"
			/>
			{#if typeSelection !== 'FILE'}
				<select class="w-full select" name="syncSchedule">
					<option disabled selected>Sync Schedule</option>
					{#each dataSourcesTable.syncSchedule.enumValues as syncSchedule}
						<option>{syncSchedule}</option>
					{/each}
				</select>
			{/if}
		{/if}
		<button type="submit" class="w-full btn btn-primary">
			{#if isLoading}
				<span class="loading loading-spinner" />
			{:else}
				Create
			{/if}
		</button>
		<form method="dialog" class="flex justify-end space-x-2">
			<button class="absolute btn btn-sm btn-circle btn-ghost right-2 top-2">x</button>
		</form>
	</form>
</dialog>
