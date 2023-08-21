<script lang="ts">
	import PricingCard from '$lib/components/PricingCard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ productInfos, maxQueries, remainingQueries } = data);
</script>

<div class="flex flex-col w-full h-full py-5 space-y-4 place-items-center">
	<div class="flex flex-col space-y-2 text-xl text-center">
		<h1>Remaining Queries:</h1>
		<h2 class="text-md">
			<span
				class={`${
					remainingQueries < 5
						? 'text-red-500'
						: remainingQueries < 10
						? 'text-yellow-500'
						: 'text-green-500'
				}`}
			>
				{remainingQueries}
			</span>{' '}
			of {maxQueries}
		</h2>
		<a href={'https://checkout.revelationsai.com/p/login/bIY5mO0MW95xgQ8288'} target="_blank">
			<button class="px-3 py-2 text-white rounded-lg bg-slate-700 hover:bg-slate-900"
				>View Current Plan</button
			>
		</a>
	</div>
	<div class="grid grid-cols-2 md:grid-cols-3">
		<PricingCard
			title="Late to Sunday Service"
			price="Free"
			features={['10 Daily Queries']}
			currentLevel={maxQueries >= 10}
		/>
		{#each productInfos as productInfo}
			<PricingCard
				title={productInfo.product.name}
				price={productInfo.product.default_price}
				features={['Ad Free', `${productInfo.product.metadata.queryLimit} Daily Queries`]}
				currentLevel={maxQueries >= parseInt(productInfo.product.metadata.queryLimit)}
				purchaseLink={productInfo.paymentLink.url}
			/>
		{/each}
	</div>
</div>
