import { stripe } from '@/core/stripe';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { Skeleton } from '@/www/components/ui/skeleton';
import { H1, P } from '@/www/components/ui/typography';
import { WithHeaderLayout } from '@/www/layouts/with-header';
import { requiresAuth } from '@/www/server/auth';
import { Meta, Title } from '@solidjs/meta';
import { type RouteDefinition, useSearchParams } from '@solidjs/router';
import { loadStripe } from '@stripe/stripe-js';
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { createEffect } from 'solid-js';
import { toast } from 'solid-sonner';
import type { Stripe } from 'stripe';

const getProducts = async () => {
  'use server';
  const productsListResponse = await stripe.products.list({
    expand: ['data.default_price'],
  });
  const products = productsListResponse.data.toSorted(
    (a, b) => Number(a.metadata.credits) - Number(b.metadata.credits),
  );
  return products;
};

const createCheckoutSession = requiresAuth(async ({ user }, product: Stripe.Product) => {
  'use server';
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: (product.default_price as Stripe.Price).id,
        quantity: 1,
      },
    ],
    client_reference_id: user.id,
    success_url: `${import.meta.env.PUBLIC_WEBSITE_URL}/credits?success=true`,
    cancel_url: `${import.meta.env.PUBLIC_WEBSITE_URL}/credits?canceled=true`,
  });
  return checkoutSession;
});

const getProductsQueryOptions = {
  queryKey: ['products-list'],
  queryFn: () => getProducts(),
};

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(getProductsQueryOptions);
  },
};

export default function CreditPurchasePage() {
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  createEffect(() => {
    if (searchParams?.success) {
      toast.success('Purchase successful');
      void queryClient.invalidateQueries({
        queryKey: ['user-credits'],
      });
    } else if (searchParams?.canceled) {
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

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  return (
    <WithHeaderLayout>
      <Title>Purchase Credits | The AI Study Bible</Title>
      <Meta name='description' content='Purchase credits for The AI Study Bible' />
      <div class='container flex h-full w-full overflow-y-auto'>
        <div class='container flex max-w-2xl flex-1 flex-col px-4 py-8'>
          <div class='flex flex-col items-center gap-2 pb-8'>
            <H1 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-center text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
              Purchase Credits
            </H1>
            <P class='text-center text-muted-foreground text-sm'>
              Credits are used to access our AI services. You can use the credits to get answers to
              your questions, generate images, and more.
            </P>
          </div>

          <div class='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <QueryBoundary
              query={query}
              loadingFallback={Array.from({ length: 6 }).map(() => (
                <div class='flex h-full w-full items-center justify-center'>
                  <Skeleton width={200} height={200} class='rounded-lg' />
                </div>
              ))}
            >
              {(products) =>
                products.map((product) => (
                  <Card class='flex flex-col justify-between'>
                    <CardHeader class='pb-2'>
                      <CardTitle class='text-lg'>{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent class='pb-2'>
                      <p class='font-bold text-2xl'>
                        $
                        {(((product.default_price as Stripe.Price).unit_amount ?? 0) / 100).toFixed(
                          2,
                        )}
                      </p>
                      <p class='text-muted-foreground text-sm'>
                        $
                        {(
                          ((product.default_price as Stripe.Price).unit_amount ?? 0) /
                          100 /
                          Number.parseInt(product.metadata.credits)
                        ).toFixed(2)}{' '}
                        / credit
                      </p>
                    </CardContent>
                    <CardFooter class='pt-2'>
                      <Button
                        class='w-full'
                        variant='outline'
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

          <div class='mt-8 flex flex-col items-center'>
            <P class='text-center text-muted-foreground text-sm'>
              Select a credit package to proceed with your purchase. Payment details will be
              collected on the next step.
            </P>
            <P>
              Looking for a different amount?{' '}
              <a href='mailto:support@theaistudybible.com' class='text-primary underline'>
                Contact us
              </a>
            </P>
          </div>
        </div>
      </div>
    </WithHeaderLayout>
  );
}
