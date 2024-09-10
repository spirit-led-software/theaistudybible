import { stripe } from '@/core/stripe';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { Skeleton } from '@/www/components/ui/skeleton';
import { H1 } from '@/www/components/ui/typography';
import { useSearchParams, type RouteDefinition } from '@solidjs/router';
import { loadStripe } from '@stripe/stripe-js';
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { createEffect } from 'solid-js';
import { toast } from 'solid-sonner';
import type { Stripe } from 'stripe';

async function getProducts() {
  'use server';
  const products = await stripe.products.list({
    expand: ['data.default_price'],
  });
  return products.data;
}

async function createCheckoutSession(product: Stripe.Product) {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: (product.default_price as Stripe.Price).id,
        quantity: 1,
      },
    ],
    client_reference_id: userId,
    success_url: `${import.meta.env.PUBLIC_WEBSITE_URL}/credits?success=true`,
    cancel_url: `${import.meta.env.PUBLIC_WEBSITE_URL}/credits?canceled=true`,
  });
  return checkoutSession;
}

const getProductsQueryOptions = {
  queryKey: ['products-list'],
  queryFn: () => getProducts(),
};

export const route: RouteDefinition = {
  preload: async () => {
    const qc = useQueryClient();
    await qc.prefetchQuery(getProductsQueryOptions);
  },
};

export default function CreditPurchasePage() {
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  createEffect(() => {
    if (searchParams?.['success']) {
      toast.success('Purchase successful');
      void queryClient.invalidateQueries({
        queryKey: ['user-credits'],
      });
    } else if (searchParams?.['canceled']) {
      toast.error('Purchase canceled');
    }
  });

  const query = createQuery(() => getProductsQueryOptions);

  const handlePurchase = createMutation(() => ({
    mutationFn: async (product: Stripe.Product) => {
      const [session, stripe] = await Promise.all([
        createCheckoutSession(product),
        loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY),
      ]);
      if (!stripe) {
        throw new Error('Error loading Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
      if (error) {
        throw new Error(error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <div class="container flex h-full max-w-3xl flex-1 flex-col overflow-y-auto px-4 py-8">
      <div class="mb-8 flex flex-col items-center gap-2">
        <H1 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-center text-transparent">
          Purchase Credits
        </H1>
        <p class="text-muted-foreground text-center text-sm">
          Credits are used to access our AI services. You can use the credits to get answers to your
          questions, generate images, and more.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QueryBoundary
          query={query}
          loadingFallback={Array.from({ length: 6 }).map(() => (
            <div class="flex h-full w-full items-center justify-center">
              <Skeleton width={200} height={200} class="rounded-lg" />
            </div>
          ))}
        >
          {(products) =>
            products.map((product) => (
              <Card class="flex flex-col justify-between">
                <CardHeader class="pb-2">
                  <CardTitle class="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent class="pb-2">
                  <p class="text-2xl font-bold">
                    ${((product.default_price as Stripe.Price).unit_amount! / 100).toFixed(2)}
                  </p>
                  <p class="text-muted-foreground text-sm">
                    $
                    {(product.default_price as Stripe.Price).unit_amount! /
                      100 /
                      parseInt(product.metadata.credits)}
                    per credit
                  </p>
                </CardContent>
                <CardFooter class="pt-2">
                  <Button
                    class="w-full"
                    variant="outline"
                    onClick={() => handlePurchase.mutate(product)}
                  >
                    Purchase
                  </Button>
                </CardFooter>
              </Card>
            ))
          }
        </QueryBoundary>
      </div>

      <div class="mt-8 flex flex-col items-center gap-2">
        <p class="text-muted-foreground text-center text-sm">
          Select a credit package to proceed with your purchase. Payment details will be collected
          on the next step.
        </p>
        <p>
          Looking for a different amount?{' '}
          <a href="mailto:support@theaistudybible.com" class="text-primary underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
