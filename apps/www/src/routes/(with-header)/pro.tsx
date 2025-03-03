import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { stripe } from '@/core/stripe';
import { syncStripeData } from '@/core/stripe/utils';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Badge } from '@/www/components/ui/badge';
import { Button } from '@/www/components/ui/button';
import { Callout, CalloutContent, CalloutTitle } from '@/www/components/ui/callout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { Skeleton } from '@/www/components/ui/skeleton';
import {} from '@/www/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/www/components/ui/tabs';
import { GradientH1, Lead, List, ListItem, Muted, P } from '@/www/components/ui/typography';
import { useSubscription } from '@/www/hooks/use-pro-subscription';
import { useProtect, useProtectFree } from '@/www/hooks/use-protect';
import { cn } from '@/www/lib/utils';
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
import { Check } from 'lucide-solid';
import { For, Show, createEffect, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Resource } from 'sst';

const getProducts = GET(() => {
  'use server';
  return Promise.resolve({
    products: [
      {
        ...Resource.ProSubProduct,
        prices: [Resource.ProSubMonthlyPrice, Resource.ProSubYearlyPrice],
      },
      {
        ...Resource.MinistrySubProduct,
        prices: [Resource.MinistrySubMonthlyPrice, Resource.MinistrySubYearlyPrice],
      },
    ],
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
    subscription_data: {
      trial_period_days: 7,
      trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
    },
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
  queryFn: () => getProducts(),
};

export const route = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(getProductsQueryOptions);
  },
} satisfies RouteDefinition;

export default function ProPage() {
  useProtectFree('/profile');
  useProtect(`/sign-in?redirectUrl=${encodeURIComponent('/pro')}`);

  const createCheckoutSession = useAction(createCheckoutSessionAction);
  const syncSubscription = useAction(syncSubscriptionAction);

  const { isActive, refetch } = useSubscription();

  const [searchParams, setSearchParams] = useSearchParams();
  createEffect(() => {
    if (searchParams?.success) {
      toast.success('Purchase successful');
      void syncSubscription();
      setSearchParams({});
    } else if (searchParams?.canceled) {
      toast.error('Purchase canceled');
      setSearchParams({});
    }
    refetch();
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
  const [selectedProductIndex, setSelectedProductIndex] = createSignal(0);

  return (
    <Show when={!isActive()} fallback={<Navigate href='/profile' />}>
      <MetaTags />
      <div class='container flex h-full w-full overflow-y-auto'>
        <div class='container flex max-w-5xl flex-1 flex-col items-center px-4 py-8'>
          <div class='flex flex-col items-center gap-2 pb-6'>
            <GradientH1 class='inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
              Choose Your Plan
            </GradientH1>
            <Lead class='max-w-2xl text-center text-muted-foreground'>
              Unlock the full potential of AI-powered Bible study with advanced features, higher
              usage limits, and priority support
            </Lead>
          </div>

          {/* Billing Period Switch */}
          <div class='mb-8'>
            <Tabs
              value={isYearly() ? 'yearly' : 'monthly'}
              onChange={(v) => setIsYearly(v === 'yearly')}
            >
              <TabsList class='w-64'>
                <TabsTrigger value='monthly' class='flex-1'>
                  Monthly
                </TabsTrigger>
                <TabsTrigger value='yearly' class='flex-1'>
                  Yearly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main Card Section */}
          <div class='relative z-10 mx-auto mt-4 mb-16 w-full max-w-5xl'>
            <div class='-inset-1 absolute animate-pulse rounded-xl bg-gradient-to-r from-primary/40 via-primary to-accent-foreground/90 opacity-75 blur-lg filter group-hover:opacity-100' />
            <QueryBoundary
              query={query}
              loadingFallback={
                <div class='flex h-full w-full items-center justify-center'>
                  <Skeleton width={400} height={400} class='rounded-xl' />
                </div>
              }
            >
              {({ products }) => (
                <div class='grid grid-cols-1 gap-8 md:grid-cols-2'>
                  <For each={products}>
                    {(product, index) => (
                      <Card
                        class={cn(
                          'relative flex flex-col overflow-hidden rounded-xl border-2 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                          selectedProductIndex() === index() ? 'border-primary' : 'border-muted',
                        )}
                        onClick={() => setSelectedProductIndex(index())}
                      >
                        {index() === 0 && !isYearly() && (
                          <div class='-right-12 absolute top-6 rotate-45 bg-primary px-12 py-1 font-bold text-primary-foreground text-sm'>
                            Popular
                          </div>
                        )}
                        <CardHeader class='space-y-6 pt-6 pb-2'>
                          <CardTitle class='text-center font-extrabold text-2xl'>
                            {product.name}
                          </CardTitle>

                          <div class='flex flex-col items-center gap-3'>
                            <div class='flex items-baseline font-bold text-3xl'>
                              $
                              {isYearly()
                                ? product.prices[1].unitAmount / 100
                                : product.prices[0].unitAmount / 100}
                              <Muted class='ml-1 inline text-lg'>
                                /{isYearly() ? 'year' : 'month'}
                              </Muted>
                            </div>

                            {isYearly() && (
                              <div class='w-fit rounded-full bg-primary/20 px-4 py-1 font-medium text-primary text-sm'>
                                Save 17%
                              </div>
                            )}

                            <Badge variant='secondary' class='mt-1 px-4 py-1 text-base'>
                              Includes 7-day free trial
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent class='px-8 py-4'>
                          <List class='space-y-3'>
                            <For each={product.features}>
                              {(feature) => (
                                <ListItem class='flex items-center text-base'>
                                  <Check class='mr-3 h-5 w-5 text-primary dark:text-primary-foreground' />
                                  {feature}
                                </ListItem>
                              )}
                            </For>
                          </List>
                        </CardContent>

                        <CardFooter class='flex flex-col gap-4 p-8'>
                          <Button
                            class={cn(
                              'w-full py-6 font-semibold text-lg shadow-md transition-all hover:opacity-90 hover:shadow-lg',
                              selectedProductIndex() === index()
                                ? 'bg-linear-to-r from-primary to-primary-foreground/90 text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/90',
                            )}
                            onClick={() => {
                              setSelectedProductIndex(index());
                              handlePurchase.mutate(
                                isYearly() ? product.prices[1].id : product.prices[0].id,
                              );
                            }}
                            disabled={handlePurchase.isPending}
                          >
                            Start Your Free Trial
                          </Button>
                          <Muted class='text-center'>
                            No charge for 7 days. Cancel anytime. Subscription will auto-renew after
                            trial.
                          </Muted>
                        </CardFooter>
                      </Card>
                    )}
                  </For>
                </div>
              )}
            </QueryBoundary>
          </div>

          {/* Value Proposition - Less prominent */}
          <div class='mb-8 grid max-w-4xl grid-cols-1 gap-4 opacity-90 md:grid-cols-3'>
            <Card class='border bg-background/80 transition-all hover:border-primary/40 hover:shadow-sm'>
              <CardHeader>
                <CardTitle class='text-center'>Deeper Insights</CardTitle>
              </CardHeader>
              <CardContent class='text-center'>
                <P class='text-muted-foreground text-sm'>
                  Access advanced AI models that provide more nuanced theological understanding and
                  contextual awareness
                </P>
              </CardContent>
            </Card>
            <Card class='border bg-background/80 transition-all hover:border-primary/40 hover:shadow-sm'>
              <CardHeader>
                <CardTitle class='text-center'>Higher Usage Limits</CardTitle>
              </CardHeader>
              <CardContent class='text-center'>
                <P class='text-muted-foreground text-sm'>
                  Higher daily limits on AI interactions, searches, or study sessions - study as
                  much as you want
                </P>
              </CardContent>
            </Card>
            <Card class='border bg-background/80 transition-all hover:border-primary/40 hover:shadow-sm'>
              <CardHeader>
                <CardTitle class='text-center'>Priority Support</CardTitle>
              </CardHeader>
              <CardContent class='text-center'>
                <P class='text-muted-foreground text-sm'>
                  Get faster responses and dedicated assistance from our team whenever you need help
                </P>
              </CardContent>
            </Card>
          </div>

          {/* Free Trial Callout - Less prominent */}
          <Callout
            variant='default'
            class='mb-8 max-w-4xl border border-primary/20 bg-muted/30 shadow-sm'
          >
            <CalloutTitle>Free Trial Available</CalloutTitle>
            <CalloutContent>
              <P>
                Try Pro with a <strong>7-day free trial</strong>. Cancel anytime during your trial
                at no cost.
              </P>
            </CalloutContent>
          </Callout>
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
