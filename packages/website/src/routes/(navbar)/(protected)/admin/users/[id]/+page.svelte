<script lang="ts">
	import Avatar from '$lib/components/user/Avatar.svelte';
	import day from 'dayjs';
	import type { PageData } from './$types';
	import ChatsTable from './ChatsTable.svelte';
	import DevotionReactionsTable from './DevotionReactionsTable.svelte';
	import RolesTable from './RolesTable.svelte';

	export let data: PageData;
</script>

<div
	class="flex h-full w-full flex-col place-items-center justify-center space-y-4 overflow-hidden p-4 lg:flex-row lg:place-items-start lg:justify-start lg:space-y-0 lg:p-8"
>
	<div
		class="flex w-full flex-shrink-0 flex-col place-items-center truncate lg:w-1/4 lg:place-items-start"
	>
		<Avatar user={data.user} size="2xl" />
		<div class="mt-4 text-base font-bold">{data.user.name ?? 'No name'}</div>
		<div class="mt-2 text-sm text-gray-500">{data.user.email}</div>
		<div class="flex flex-wrap space-x-5 lg:flex-col lg:space-x-0">
			<div class="mt-2 flex flex-col text-sm text-gray-500">
				<div class="font-bold">Joined:</div>
				<div>{day(data.user.createdAt).format('M/D/YY')}</div>
			</div>
			<div class="mt-2 flex flex-col text-sm text-gray-500">
				<div class="font-bold">Last Updated:</div>
				<div>{day(data.user.updatedAt).format('M/D/YY')}</div>
			</div>
			<div class="mt-2 flex flex-col text-sm text-gray-500">
				<div class="font-bold">Last Seen:</div>
				<div>{data.user.lastSeenAt ? day(data.user.lastSeenAt).format('M/D/YY') : 'N/A'}</div>
			</div>
			<div class="mt-2 flex flex-col text-sm text-gray-500">
				<div class="font-bold">Stripe Customer ID:</div>
				<div>{data.user.stripeCustomerId ?? 'N/A'}</div>
			</div>
		</div>
	</div>
	<div class="grid h-full w-full grid-cols-1 overflow-scroll">
		<div class="flex max-h-full w-full flex-col">
			<RolesTable userId={data.user.id} />
		</div>
		<div class="flex max-h-full w-full flex-col">
			<ChatsTable userId={data.user.id} />
		</div>
		<div class="flex max-h-full w-full flex-col">
			<DevotionReactionsTable userId={data.user.id} />
		</div>
	</div>
</div>
