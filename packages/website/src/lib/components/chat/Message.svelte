<script lang="ts">
	import type { UserWithRoles } from '@core/model';
	import type { Message } from 'ai';
	import Cross from '../branding/Cross.svelte';
	import Avatar from '../user/Avatar.svelte';
	import ResponseSources from './ResponseSources.svelte';

	export let chatId: string | undefined;
	export let message: Message;
	export let prevMessage: Message | undefined;
	export let user: UserWithRoles;

	$: ({ id, role, content } = message);
</script>

<div
	class="flex flex-row items-center w-full px-2 py-4 overflow-x-hidden bg-white border border-t-slate-300"
>
	<div class="flex flex-col content-start">
		{#if role === 'user'}
			<Avatar {user} size="md" class="border shadow-lg" />
		{:else}
			<div class="px-3 py-2 rounded-full shadow-lg outline outline-slate-200">
				<Cross colorscheme="dark" size="lg" />
			</div>
		{/if}
	</div>
	<div class="flex flex-col w-full pl-5 pr-3 overflow-x-clip">
		<div class="w-full break-words whitespace-pre-wrap">{content}</div>
		{#if role !== 'user'}
			<ResponseSources aiResponseId={id} {chatId} />
		{/if}
	</div>
</div>
