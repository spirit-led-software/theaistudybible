<script lang="ts">
	import { createUser } from '$lib/services/admin/user';
	import { session } from '$lib/stores/user';
	import type { User } from '@revelationsai/core/model/user';
	import { createMutation, useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
	import type { EventHandler } from 'svelte/elements';
	import { v4 as uuidV4 } from 'uuid';

	export let createDialog: HTMLDialogElement | undefined = undefined;

	export const show = () => {
		createDialog?.showModal();
	};

	let isLoading = false;

	const client = useQueryClient();

	const handleCreate = async (data: Partial<User> & { password?: string }) => {
		return await createUser(data, {
			session: $session!
		});
	};

	const createUserMutation = createMutation({
		mutationFn: handleCreate,
		onMutate: async (input) => {
			await client.cancelQueries({ queryKey: ['infinite-users'] });
			const previousUsers = client.getQueryData<InfiniteData<User[]>>(['infinite-users']);
			if (previousUsers) {
				client.setQueryData<InfiniteData<User[]>>(['infinite-users'], {
					pages: [
						[
							{
								id: input.id!,
								name: input.name!,
								email: input.email!,
								createdAt: new Date(),
								updatedAt: new Date(),
								hasCustomImage: false,
								stripeCustomerId: uuidV4(),
								image: null,
								translation: 'NIV'
							} satisfies User,
							...previousUsers.pages[0]
						],
						...previousUsers.pages.slice(1)
					],
					pageParams: previousUsers.pageParams
				});
			}
			return { previousUsers };
		},
		onSettled: () => {
			client.invalidateQueries({ queryKey: ['infinite-users'] });
		}
	});

	const handleSubmitCreate: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
		const formData = new FormData(event.currentTarget);
		const name = (formData.get('name') || undefined) as string | undefined;
		const email = (formData.get('email') || undefined) as string | undefined;
		const password = (formData.get('password') || undefined) as string | undefined;

		if (!name || !email) {
			alert('Missing required fields "name" and "email"');
			return;
		}

		const userId = uuidV4();
		isLoading = true;
		try {
			$createUserMutation.mutate({
				id: userId,
				name,
				email,
				password
			});
			createDialog?.close();
			event.currentTarget.reset();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Unknown error');
		} finally {
			isLoading = false;
		}
	};
</script>

<dialog bind:this={createDialog} class="modal">
	<form on:submit|preventDefault={handleSubmitCreate} class="p-10 space-y-2 modal-box">
		<h1 class="text-2xl font-bold">Create User</h1>
		<div class="flex flex-col space-y-2">
			<label for="name">Name*</label>
			<input type="text" name="name" id="name" class="input input-bordered" required />
		</div>
		<div class="flex flex-col space-y-2">
			<label for="email">Email*</label>
			<input type="email" name="email" id="email" class="input input-bordered" required />
		</div>
		<div class="flex flex-col space-y-2">
			<label for="password">Password</label>
			<input
				type="password"
				name="password"
				id="password"
				class="input input-bordered"
				autocomplete="new-password"
			/>
		</div>
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
