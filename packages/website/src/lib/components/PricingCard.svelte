<script lang="ts">
  import { user } from '$lib/stores/user';
  import type Stripe from 'stripe';

  export let features: (string | undefined)[];
  export let title: string;
  export let price: string | Stripe.Price | null | undefined;
  export let currentLevel: boolean = false;
  export let purchaseLink: string | undefined = undefined;

  let priceString: string | undefined = undefined;

  $: if (typeof price === 'object' && price?.unit_amount) {
    priceString = `$${price.unit_amount / 100}/${price.recurring?.interval.toString()}`;
  } else if (typeof price === 'string') {
    priceString = price;
  }

  $: email = $user!.email;
  $: userId = $user!.id;
</script>

<div class="m-3 flex flex-col justify-between rounded-lg bg-slate-200 px-5 py-7">
  <div class="mb-3 flex w-full flex-col space-y-4">
    <h1 class="font-kanit text-lg italic">{title}</h1>
    <h2 class="font-kanit text-slate-700">{priceString}</h2>
    <ul class="list-inside list-disc">
      {#each features as feature}
        {#if feature}
          <li class="list-item">{feature}</li>
        {/if}
      {/each}
    </ul>
  </div>
  <div class="flex w-full flex-col">
    {#if !currentLevel && priceString !== 'Free'}
      <a
        href={`${purchaseLink}?prefilled_email=${encodeURIComponent(
          email
        )}&client_reference_id=${encodeURIComponent(userId)}`}
        target="_blank"
        class="block"
      >
        <button
          class="w-full rounded-lg bg-blue-300 px-3 py-2 font-medium text-white hover:bg-blue-400"
        >
          Purchase
        </button>
      </a>
    {/if}
  </div>
</div>
