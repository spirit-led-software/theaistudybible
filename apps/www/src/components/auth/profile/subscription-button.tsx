import { stripe } from '@/core/stripe';
import type { SubscriptionData } from '@/core/stripe/types';
import { getStripeData, syncStripeData } from '@/core/stripe/utils';
import { useSubscription } from '@/www/hooks/use-pro-subscription';
import { requireAuth } from '@/www/server/utils/auth';
import { A, action, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { formatDate } from 'date-fns';
import { Match, Switch, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Button, type ButtonProps } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';

type ActiveSubscription = SubscriptionData & { status: 'active' | 'trialing' };

const unsubscribeAction = action(async () => {
  'use server';
  const { user } = requireAuth();
  if (!user.stripeCustomerId) throw new Error('User has no Stripe customer ID');

  const subData = await getStripeData(user.stripeCustomerId);
  if (subData.status !== 'active' && subData.status !== 'trialing') {
    throw new Error('User has no active subscription');
  }

  await stripe.subscriptions.update(subData.subscriptionId, { cancel_at_period_end: true });
  await syncStripeData(user.stripeCustomerId);
  return { success: true };
});

const renewAction = action(async () => {
  'use server';
  const { user } = requireAuth();
  if (!user.stripeCustomerId) throw new Error('User has no Stripe customer ID');

  const subData = await getStripeData(user.stripeCustomerId);
  if (subData.status !== 'active' && subData.status !== 'trialing') {
    throw new Error('User has no active subscription');
  }

  await stripe.subscriptions.update(subData.subscriptionId, { cancel_at_period_end: false });
  await syncStripeData(user.stripeCustomerId);
  return { success: true };
});

export type SubscriptionButtonProps = Omit<ButtonProps, 'children' | 'onClick'>;

export const SubscriptionButton = (props: SubscriptionButtonProps) => {
  const unsubscribe = useAction(unsubscribeAction);
  const renew = useAction(renewAction);

  const { isActive, subscription, refetch, isPro } = useSubscription();
  const [isOpen, setIsOpen] = createSignal(false);

  const handleUnsubscribe = createMutation(() => ({
    mutationFn: () => unsubscribe(),
    onSuccess: () => {
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      refetch();
    },
  }));

  const handleRenew = createMutation(() => ({
    mutationFn: () => renew(),
    onSuccess: () => {
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      refetch();
    },
  }));

  return (
    <Switch
      fallback={
        <Button as={A} href='/pro' {...props}>
          Upgrade to Pro
        </Button>
      }
    >
      <Match
        when={
          (subscription()?.status === 'active' || subscription()?.status === 'trialing') &&
          (subscription() as ActiveSubscription).cancelAtPeriodEnd
        }
      >
        <Button onClick={() => handleRenew.mutate()} {...props}>
          Renew
        </Button>
      </Match>
      <Match when={isActive() && (subscription() as ActiveSubscription)} keyed>
        {(subscription) => (
          <Dialog open={isOpen()} onOpenChange={setIsOpen}>
            <DialogTrigger as={Button} {...props}>
              Unsubscribe
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unsubscribe</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Are you sure you want to unsubscribe from the {isPro() ? 'Pro' : 'Ministry'} plan?
                Your subscription will end on{' '}
                {formatDate(new Date(subscription.currentPeriodEnd * 1000), 'MMMM d, yyyy')}
              </DialogDescription>
              <DialogFooter>
                <Button variant='outline' onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUnsubscribe.mutate()}>Unsubscribe</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Match>
    </Switch>
  );
};
