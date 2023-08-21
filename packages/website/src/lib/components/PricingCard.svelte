<script lang="ts">
	import type Stripe from 'stripe';

	export let features: string[];
	export let title: string;
	export let price: string | Stripe.Price | null | undefined;
	export let currentLevel: boolean = false;
	export let purchaseLink: string | undefined = undefined;

	let priceString: string | undefined = undefined;

	$: if (typeof price === 'object' && price?.unit_amount) {
		priceString = `\$${price.unit_amount / 100}/${price.recurring?.interval.toString()}`;
	} else if (typeof price === 'string') {
		priceString = price;
	}
</script>

<div class="flex flex-col justify-between px-5 m-3 rounded-lg py-7 bg-slate-200">
	<div class="flex flex-col w-full mb-3 space-y-4">
		<h1 class="text-lg italic font-kanit">{title}</h1>
		<h2 class="text-slate-700 font-kanit">{priceString}</h2>
		<ul>
			{#each features as feature}
				<li>{feature}</li>
			{/each}
		</ul>
	</div>
	<div class="flex flex-col w-full">
		{#if !currentLevel && priceString !== 'Free'}
			<a href={purchaseLink} target="_blank" class="block">
				<button
					class="w-full px-3 py-2 font-medium text-white bg-blue-300 rounded-lg hover:bg-blue-400"
					>Purchase</button
				>
			</a>
		{/if}
	</div>
</div>
