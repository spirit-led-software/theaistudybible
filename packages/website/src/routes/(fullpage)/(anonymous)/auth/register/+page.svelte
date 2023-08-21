<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
	import Logo from '$lib/components/branding/Logo.svelte';
	import Icon from '@iconify/svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let alertMessage:
		| {
				type: 'error' | 'success';
				text: string;
		  }
		| undefined = undefined;

	$: if ($page.url.searchParams.get('error')) {
		alertMessage = {
			type: 'error',
			text: $page.url.searchParams.get('error')!
		};
	}
	$: if ($page.url.searchParams.get('success')) {
		alertMessage = {
			type: 'success',
			text: $page.url.searchParams.get('success')!
		};
	}

	$: if (form?.errors?.banner) {
		alertMessage = {
			type: 'error',
			text: form.errors.banner
		};
	}
	$: if (form?.success?.banner) {
		alertMessage = {
			type: 'success',
			text: form.success.banner
		};
	}

	$: alertMessage && setTimeout(() => (alertMessage = undefined), 8000);
</script>

<div
	class="relative flex flex-col w-full px-5 pt-3 pb-10 bg-white shadow-xl lg:w-1/3 lg:h-full lg:place-content-center lg:px-20 md:w-1/2 sm:w-2/3"
>
	{#if alertMessage}
		<div class="absolute left-0 right-0 flex justify-center place-items-center -top-20 lg:top-20">
			<div
				class={`w-5/6 px-4 py-2 text-center text-white mx-auto rounded-xl lg:text-xl ${
					alertMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'
				}`}
			>
				{alertMessage.text}
			</div>
		</div>
	{/if}
	<div class="flex flex-col">
		<div
			class="items-center px-3 py-2 mx-auto my-8 text-center border rounded-lg border-slate-400 lg:mb-10 lg:py-4 lg:px-6"
		>
			<Logo size="2xl" colorscheme={'dark'} />
		</div>
		<div class="divide-y divide-gray-600">
			<div class="flex flex-col w-full pb-4 space-y-3 text-center">
				<form class="flex flex-col w-full" method="POST" action="?/social" use:enhance>
					<input type="hidden" name="provider" value="google" />
					<button
						type="submit"
						class="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
					>
						<Icon icon="fa6-brands:google" class="inline-block mr-2 text-white" />
						Register with Google
					</button>
				</form>
				<form class="flex flex-col w-full" method="POST" action="?/social" use:enhance>
					<input type="hidden" name="provider" value="facebook" />
					<button
						type="submit"
						class="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
					>
						<Icon icon="fa6-brands:facebook-f" class="inline-block mr-2 text-white" />
						Register with Facebook
					</button>
				</form>
			</div>
			<form class="flex flex-col w-full pt-4 space-y-3" method="POST" action="?/email" use:enhance>
				<input
					id="email"
					name="email"
					type="email"
					class="w-full px-2 py-2 border shadow-xl outline-none focus:outline-none"
					placeholder="Email address"
				/>
				<PasswordInput id="password" name="password" class="w-full shadow-xl" />
				<PasswordInput
					id="confirmPassword"
					name="confirmPassword"
					placeholder="Confirm Password"
					class="w-full shadow-xl"
				/>
				<button
					type="submit"
					class="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
				>
					Register with Email
				</button>
				<div class="flex justify-between text-sm text-gray-500">
					<a href="/auth/login" class="hover:underline">Already have an account? Login here.</a>
				</div>
			</form>
		</div>
	</div>
</div>
