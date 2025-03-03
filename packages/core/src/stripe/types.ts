export type SubscriptionData =
  | { status: 'none' }
  | {
      subscriptionId: string;
      status: string;
      priceId: string;
      productId: string;
      currentPeriodEnd: number;
      currentPeriodStart: number;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null;
        last4: string | null;
      } | null;
    };
