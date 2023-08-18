<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Logo from '$lib/components/branding/Logo.svelte';
	import Icon from '@iconify/svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let alertMessage: string | undefined = $page.url.searchParams.get('error') || undefined;

	$: if (form?.errors?.banner) {
		alertMessage = form.errors.banner;
	}

	$: alertMessage && setTimeout(() => (alertMessage = undefined), 8000);
</script>

<div
	class="relative flex flex-col w-full px-5 pt-3 pb-10 bg-white shadow-xl lg:w-1/3 lg:h-full lg:place-content-center lg:px-20 md:w-1/2"
>
	{#if alertMessage}
		<div class="absolute left-0 right-0 flex -top-20 lg:top-20">
			<div class="px-4 py-2 mx-auto text-white bg-red-500 rounded-xl lg:text-xl">
				{alertMessage}
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
						Login with Google
					</button>
				</form>
				<form class="flex flex-col w-full" method="POST" action="?/social" use:enhance>
					<input type="hidden" name="provider" value="facebook" />
					<button
						type="submit"
						class="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
					>
						<Icon icon="fa6-brands:facebook-f" class="inline-block mr-2 text-white" />
						Login with Facebook
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
				<input
					id="password"
					name="password"
					type="password"
					class="w-full px-2 py-2 border shadow-xl outline-none focus:outline-none"
					placeholder="Password"
				/>
				<button
					type="submit"
					class="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
				>
					Login with Email
				</button>
			</form>
		</div>
	</div>
</div>
