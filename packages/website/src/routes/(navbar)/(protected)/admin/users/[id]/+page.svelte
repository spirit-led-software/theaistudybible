<script lang="ts">
	import Avatar from '$lib/components/user/Avatar.svelte';
	import day from 'dayjs';
	import type { PageData } from './$types';
	import UserChatsTable from './UserChatsTable.svelte';
	import UserDevotionReactionsTable from './UserDevotionReactionsTable.svelte';

	export let data: PageData;
</script>

<div class="flex h-full w-full overflow-hidden p-4 lg:p-8">
	<div class="flex w-1/3 flex-shrink-0 flex-col lg:w-1/4">
		<Avatar user={data.user} size="2xl" />
		<div class="mt-4 text-base font-bold">{data.user.name ?? data.user.email}</div>
		<div class="mt-2 text-sm text-gray-500">{data.user.email}</div>
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
	<div class="grid h-full w-full grid-cols-1 overflow-scroll">
		<div class="h-full w-full">
			<UserChatsTable userId={data.user.id} />
		</div>
		<div class="h-full w-full">
			<UserDevotionReactionsTable userId={data.user.id} />
		</div>
	</div>
</div>
