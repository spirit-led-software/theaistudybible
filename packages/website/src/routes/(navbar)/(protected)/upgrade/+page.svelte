<script lang="ts">
	import PricingCard from '$lib/components/PricingCard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ user, productInfos } = data);
</script>

<svelte:head>
	<title>Upgrade Account</title>
	<meta name="description" content="Upgrade your account to access more queries" />
</svelte:head>

<div class="flex flex-col w-full h-full py-5 space-y-4 place-items-center overflow-y-scroll">
	<div class="flex flex-col space-y-2 text-xl text-center">
		<h1>Remaining Queries:</h1>
		<h2 class="text-base">
			<span
				class={`${
					user.remainingQueries < 3
						? 'text-red-500'
						: user.remainingQueries < 5
							? 'text-yellow-500'
							: 'text-green-500'
				}`}
			>
				{user.maxQueries > 5 ? 'Unlimited' : user.remainingQueries}
			</span>{' '}
			of {user.maxQueries > 5 ? 'Unlimited' : user.maxQueries}
		</h2>
		<a
			href={`https://checkout.revelationsai.com/p/login/bIY5mO0MW95xgQ8288?prefilled_email=${encodeURIComponent(user.email)}`}
			target="_blank"
		>
			<button class="px-3 py-2 text-white rounded-lg bg-slate-700 hover:bg-slate-900">
				View Current Plan
			</button>
		</a>
	</div>
	<div class="grid grid-cols-2 md:grid-cols-3">
		<PricingCard
			title="RevelationsAI Standard"
			price="Free"
			features={['5 Daily Queries', '1 Daily Image (Mobile-Only)']}
			currentLevel={user.maxQueries <= 5}
		/>
		{#each productInfos as productInfo}
			<PricingCard
				title={productInfo.product.name}
				price={productInfo.product.default_price}
				features={productInfo.product.features
					.filter((feature) => feature.name)
					.map((feature) => feature.name)}
				currentLevel={user.maxQueries > 5}
				purchaseLink={productInfo.paymentLink.url}
			/>
		{/each}
	</div>
</div>
