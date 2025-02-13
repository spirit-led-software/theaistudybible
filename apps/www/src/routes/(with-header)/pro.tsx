import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { stripe } from '@/core/stripe';
import { syncStripeData } from '@/core/stripe/utils';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { Skeleton } from '@/www/components/ui/skeleton';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '@/www/components/ui/switch';
import { H1, List, ListItem } from '@/www/components/ui/typography';
import { useProSubscription } from '@/www/hooks/use-pro-subscription';
import { useProtectNotPro } from '@/www/hooks/use-protect';
import { requireAuth } from '@/www/server/utils/auth';
import { Meta, Title } from '@solidjs/meta';
import {
  Navigate,
  type RouteDefinition,
  action,
  useAction,
  useSearchParams,
} from '@solidjs/router';
import { GET } from '@solidjs/start';
import { loadStripe } from '@stripe/stripe-js';
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { For, Show, createEffect, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';

const getProduct = GET(() => {
  'use server';
  return Promise.resolve({
    product: Resource.ProSubProduct,
    prices: [Resource.ProSubMonthlyPrice, Resource.ProSubYearlyPrice],
  });
});

const createCheckoutSessionAction = action(async (priceId: string) => {
  'use server';
  let { user } = requireAuth();
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    [user] = await db
      .update(users)
      .set({ stripeCustomerId: customer.id })
      .where(eq(users.id, user.id))
      .returning();
  }
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId!,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${import.meta.env.PUBLIC_WEBAPP_URL}/pro?success=true`,
    cancel_url: `${import.meta.env.PUBLIC_WEBAPP_URL}/pro?canceled=true`,
    metadata: { userId: user.id },
  });
  return { checkoutSession };
});

const syncSubscriptionAction = action(async () => {
  'use server';
  const { user } = requireAuth();
  if (!user.stripeCustomerId) {
    throw new Error('User does not have a Stripe customer ID');
  }
  await syncStripeData(user.stripeCustomerId!);
});

const getProductsQueryOptions = {
  queryKey: ['products-list'],
  queryFn: () => getProduct(),
};

export const route = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(getProductsQueryOptions);
  },
} satisfies RouteDefinition;

export default function CreditPurchasePage() {
  useProtectNotPro('/profile');

  const createCheckoutSession = useAction(createCheckoutSessionAction);
  const syncSubscription = useAction(syncSubscriptionAction);

  const [searchParams] = useSearchParams();
  createEffect(() => {
    if (searchParams?.success) {
      toast.success('Purchase successful');
      void syncSubscription();
    } else if (searchParams?.canceled) {
      toast.error('Purchase canceled');
    }
  });

  const query = createQuery(() => getProductsQueryOptions);

  const handlePurchase = createMutation(() => ({
    mutationFn: async (priceId: string) => {
      const [{ checkoutSession }, stripe] = await Promise.all([
        createCheckoutSession(priceId),
        loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY),
      ]);
      if (!stripe) {
        throw new Error('Error loading Stripe');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutSession.id,
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const [isYearly, setIsYearly] = createSignal(false);
  const { hasPro } = useProSubscription();

  return (
    <Show when={!hasPro()} fallback={<Navigate href='/profile' />}>
      <MetaTags />
      <div class='container flex h-full w-full overflow-y-auto'>
        <div class='container flex max-w-2xl flex-1 flex-col px-4 py-8'>
          <div class='flex flex-col items-center gap-2 pb-8'>
            <H1 class='inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
              Upgrade to Pro
            </H1>
          </div>

          <div class='mx-auto w-full max-w-md'>
            <QueryBoundary
              query={query}
              loadingFallback={
                <div class='flex h-full w-full items-center justify-center'>
                  <Skeleton width={200} height={200} class='rounded-lg' />
                </div>
              }
            >
              {({ product, prices }) => (
                <Card class='relative flex flex-col overflow-hidden border-2 transition-all hover:border-primary'>
                  {!isYearly() && (
                    <div class='-right-12 absolute top-6 rotate-45 bg-primary px-12 py-1 text-primary-foreground text-sm'>
                      Popular
                    </div>
                  )}
                  <CardHeader class='space-y-4'>
                    <Switch
                      checked={isYearly()}
                      onChange={setIsYearly}
                      class='flex items-center justify-center gap-4'
                    >
                      <SwitchLabel>Monthly</SwitchLabel>
                      <SwitchControl>
                        <SwitchThumb />
                      </SwitchControl>
                      <SwitchLabel>Yearly</SwitchLabel>
                    </Switch>

                    <CardTitle class='text-center font-bold text-2xl'>
                      {isYearly() ? 'Yearly' : 'Monthly'} Plan
                    </CardTitle>

                    <div class='flex flex-col items-center gap-2'>
                      <div class='flex items-baseline font-semibold text-2xl'>
                        ${isYearly() ? prices[1].unitAmount / 100 : prices[0].unitAmount / 100}
                        <span class='font-normal text-base text-muted-foreground'>
                          /{isYearly() ? 'year' : 'month'}
                        </span>
                      </div>

                      {isYearly() && (
                        <div class='w-fit rounded-full bg-primary/10 px-3 py-1 text-primary text-sm'>
                          Save 17%
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <List>
                      <For each={product.features}>
                        {(feature) => (
                          <ListItem class='flex items-center'>
                            <span class='mr-2'>✓</span>
                            {feature}
                          </ListItem>
                        )}
                      </For>
                    </List>
                  </CardContent>

                  <CardFooter>
                    <Button
                      class='w-full'
                      onClick={() =>
                        handlePurchase.mutate(isYearly() ? prices[1].id : prices[0].id)
                      }
                      disabled={handlePurchase.isPending}
                    >
                      Get Started
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </QueryBoundary>
          </div>
        </div>
      </div>
    </Show>
  );
}

const MetaTags = () => {
  const title = 'Upgrade to Pro | The AI Study Bible - Unlock More Insights';
  const description =
    'Upgrade to Pro to get access to advanced AI models, higher daily AI limits, and more.';

  return (
    <>
      <Title>{title}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title} />
      <Meta property='og:description' content={description} />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
