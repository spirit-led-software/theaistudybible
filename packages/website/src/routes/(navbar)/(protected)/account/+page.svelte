<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_AUTH_URL } from '$env/static/public';
	import Avatar from '$lib/components/user/Avatar.svelte';
	import { deleteUser } from '$lib/services/user';
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ user, session } = data);
</script>

<svelte:head>
	<title>Account</title>
</svelte:head>

<main class="relative flex flex-col justify-center w-full h-full place-items-center">
	<div class="absolute flex px-10 py-3 text-white bg-blue-300 top-10 rounded-xl">
		<Icon icon="mdi:alert-circle-outline" class="w-6 h-6 mr-2" />
		Account editing coming soon!
	</div>
	<div class="flex flex-col justify-center w-full space-y-5 place-items-center lg:w-1/2">
		<Avatar size="xl" />
		<h1 class="text-lg font-medium">{user.name ?? user.email}</h1>
		<div class="flex flex-col space-y-3">
			<a class="text-white bg-blue-300 btn hover:bg-blue-400 active:bg-blue-400" href="/upgrade"
				>Upgrade</a
			>
			<a
				class="text-white btn bg-slate-700 hover:bg-slate-900 active:bg-slate-900"
				href={`${PUBLIC_AUTH_URL}/logout`}>Logout</a
			>
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
							await goto(`${PUBLIC_AUTH_URL}/logout`);
						}
					}}>Delete Account</button
				>
			</div>
		</div>
	</div>
</main>
