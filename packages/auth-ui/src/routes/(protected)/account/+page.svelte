<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_WEBSITE_URL } from '$env/static/public';
	import Avatar from '$lib/components/user/Avatar.svelte';
	import Icon from '@iconify/svelte';
	import {
		deleteUser,
		updateUser,
		uploadProfilePicture
	} from '@revelationsai/client/services/user';
	import type { PageData } from './$types';
	import ChangePasswordDialog from './ChangePasswordDialog.svelte';
	import EditEmailDialog from './EditEmailDialog.svelte';
	import EditNameDialog from './EditNameDialog.svelte';

	export let data: PageData;

	let fileInput: HTMLInputElement | undefined = undefined;
	let editNameDialog: EditNameDialog | undefined = undefined;
	let editEmailDialog: EditEmailDialog | undefined = undefined;
	let changePasswordDialog: ChangePasswordDialog | undefined = undefined;

	let isLoading = false;

	$: ({ user, session } = data);
</script>

<svelte:head>
	<title>Account</title>
</svelte:head>

<main class="relative flex flex-col justify-center w-full h-full place-items-center">
	<a
		class="absolute flex place-items-center top-0 left-0 m-5 p-5 hover:underline"
		href={`${PUBLIC_WEBSITE_URL}${$page.url.searchParams.get('returnPath') ?? ''}`}
	>
		<Icon icon="mdi:arrow-left" class="w-5 h-5 mr-2" />
		Back to RevelationsAI
	</a>
	<div class="flex flex-col justify-center w-full space-y-5 place-items-center lg:w-1/2">
		{#if isLoading}
			<div class="loading loading-sm" />
		{/if}
		<Avatar size="2xl">
			<button on:click={() => fileInput?.click()}>
				<Icon icon="mdi:pencil" />
			</button>
			<input
				type="file"
				style="display: none;"
				bind:this={fileInput}
				on:change|preventDefault={async (event) => {
					// @ts-expect-error Not sure why this is happening
					const file = event.target.files[0];
					if (file) {
						isLoading = true;
						try {
							// @ts-expect-error Can't use a bang here
							const imageUrl = await uploadProfilePicture(file, session);
							await updateUser(
								user.id,
								{
									image: imageUrl
								},
								{
									// @ts-expect-error Can't use a bang here
									session: session
								}
							);
							await invalidateAll();
						} finally {
							isLoading = false;
						}
					}
				}}
			/>
		</Avatar>
		<div class="flex space-x-3 place-items-center">
			<div class="label">Name:</div>
			<p class="text-lg">
				{user.name ?? user.email}
			</p>
			<button on:click={() => editNameDialog?.show()}>
				<Icon icon="mdi:pencil" class="w-5 h-5" />
			</button>
			<EditNameDialog bind:this={editNameDialog} />
		</div>
		<div class="flex space-x-3 place-items-center">
			<div class="label">Email:</div>
			<p class="text-lg">
				{user.email}
			</p>
			<button on:click={() => editEmailDialog?.show()}>
				<Icon icon="mdi:pencil" class="w-5 h-5" />
			</button>
			<EditEmailDialog bind:this={editEmailDialog} />
		</div>
		<div class="flex space-x-3 place-items-center">
			<div class="label">Password:</div>
			<p class="text-lg">*************</p>
			<button on:click={() => changePasswordDialog?.show()}>
				<Icon icon="mdi:pencil" class="w-5 h-5" />
			</button>
			<ChangePasswordDialog bind:this={changePasswordDialog} />
		</div>
		<div class="flex flex-col space-y-3">
			<a
				class="text-white btn bg-slate-700 hover:bg-slate-900 active:bg-slate-900"
				href={'/logout'}
			>
				Logout
			</a>
			<div class="flex flex-col px-10 py-5 space-y-1 text-center bg-red-100 rounded-xl">
				<h2 class="text-red-700">Danger Zone</h2>
				<button
					class="text-white bg-red-300 btn hover:bg-red-400 active:bg-red-400"
					on:click={async () => {
						if (
							confirm(
								'Are you sure you want to delete your account and all of its data? This action cannot be undone.'
							)
						) {
							await deleteUser(user.id, {
								// @ts-expect-error Can't use a bang here
								session: session
							});
							await goto('/logout');
						}
					}}>Delete Account</button
				>
			</div>
		</div>
	</div>
</main>
