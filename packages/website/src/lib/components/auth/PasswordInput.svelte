<script lang="ts">
	import Icon from '@iconify/svelte';
	import { cn } from '@revelationsai/client/utils/class-names';

	let className: string | undefined = undefined;
	export { className as class };
	export let id: string = 'password';
	export let name: string = 'password';
	export let placeholder: string = 'Password';

	let showPassword: boolean = false;

	let ref: HTMLInputElement | undefined = undefined;

	$: if (ref?.type) showPassword ? (ref.type = 'text') : (ref.type = 'password');
</script>

<div
	class={cn(
		'inline-flex px-2 py-2 border bg-white outline-none justify-center place-items-center',
		className
	)}
>
	<input
		{id}
		{name}
		type="password"
		class={'w-full focus:outline-none'}
		{placeholder}
		bind:this={ref}
	/>
	<button
		tabindex={-1}
		type="button"
		on:click|preventDefault={() => (showPassword = !showPassword)}
	>
		<Icon
			icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'}
			width={16}
			height={16}
			class="text-slate-500 hover:text-slate-700"
		/>
	</button>
</div>
