<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
	import { updatePassword } from '$lib/services/user';
	import { session } from '$lib/stores/user';
	import type { EventHandler } from 'svelte/elements';

	export const show = () => {
		dialog?.showModal();
	};

	let dialog: HTMLDialogElement | undefined = undefined;

	let isLoading = false;
	let alert: {
		type: 'success' | 'error';
		message: string;
	} | null = null;
	let errors: {
		[key: string]: string;
	}[] = [];

	const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
		const formData = new FormData(event.currentTarget);
		const data: {
			currentPassword?: string;
			newPassword?: string;
			confirmPassword?: string;
		} = Object.fromEntries(formData.entries());
		console.log(data);

		isLoading = true;
		errors = [];
		try {
			if (!data.currentPassword) {
				errors.push({
					currentPassword: 'Current Password is required.'
				});
			}
			if (!data.newPassword) {
				errors.push({
					newPassword: 'New Password is required.'
				});
			}
			if (!data.confirmPassword) {
				errors.push({
					confirmPassword: 'Confirm Password is required.'
				});
			}
			if (data.newPassword !== data.confirmPassword) {
				alert = {
					type: 'error',
					message: 'Passwords do not match.'
				};
				return;
			}
			if (errors.length > 0) {
				return;
			}

			await updatePassword($session!, {
				currentPassword: data.currentPassword!,
				newPassword: data.newPassword!
			});
			await invalidateAll();

			alert = {
				type: 'success',
				message: 'Password updated successfully.'
			};

			setTimeout(() => {
				dialog?.close();
				event.currentTarget.reset();
			}, 1000);
		} catch (error) {
			console.error("Couldn't update user", error);
			if (error instanceof Error) {
				alert = {
					type: 'error',
					message: error.message
				};
			} else {
				alert = {
					type: 'error',
					message: 'An unknown error occurred.'
				};
			}
		} finally {
			isLoading = false;
		}
	};
</script>

<dialog bind:this={dialog} class="modal">
	<form on:submit|preventDefault={handleSubmit} class="p-10 space-y-4 modal-box">
		{#if alert}
			<div class={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
				{alert.message}
			</div>
		{/if}
		<h2 class="text-xl font-medium">Change Password</h2>
		<div class="flex flex-col space-y-2">
			<label for="currentPassword">Current Password</label>
			<PasswordInput name="currentPassword" id="currentPassword" class="input input-bordered" />
			{#if errors.find((error) => error.currentPassword)}
				<div class="text-error text-xs">
					{errors.find((error) => error.currentPassword)?.currentPassword}
				</div>
			{/if}
			<label for="newPassword">New Password</label>
			<PasswordInput name="newPassword" id="newPassword" class="input input-bordered" />
			{#if errors.find((error) => error.newPassword)}
				<div class="text-error text-xs">
					{errors.find((error) => error.newPassword)?.newPassword}
				</div>
			{/if}
			<label for="confirmPassword">Confirm New Password</label>
			<PasswordInput name="confirmPassword" id="confirmPassword" class="input input-bordered" />
			{#if errors.find((error) => error.confirmPassword)}
				<div class="text-error text-xs">
					{errors.find((error) => error.confirmPassword)?.confirmPassword}
				</div>
			{/if}
			<button type="submit" class="w-full btn btn-primary">
				{#if isLoading}
					<span class="loading loading-spinner" />
				{:else}
					Save
				{/if}
			</button>
			<form method="dialog" class="flex justify-end space-x-2">
				<button class="absolute btn btn-sm btn-circle btn-ghost right-2 top-2">x</button>
			</form>
		</div>
	</form>
</dialog>
