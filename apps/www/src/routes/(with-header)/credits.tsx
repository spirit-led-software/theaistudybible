import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { H1, H6 } from '@/www/components/ui/typography';

const creditOptions = [
  { amount: 10, price: 4.99 },
  { amount: 25, price: 10.99 },
  { amount: 50, price: 20.99 },
  { amount: 100, price: 40.99 },
];

export default function CreditPurchasePage() {
  return (
    <div class="container mx-auto overflow-y-auto px-4 py-8">
      <div class="mb-8 flex flex-col items-center gap-2">
        <H1 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-center text-transparent">
          Purchase Credits
        </H1>
        <div>
          <H6>Spend credits using AI</H6>
          <ul class="list-inside list-disc">
            <li class="text-sm">1 response = 1 credit</li>
            <li class="text-sm">1 image = 5 credits</li>
          </ul>
        </div>
      </div>

      <div class="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {creditOptions.map((option) => (
          <Card class="flex flex-col justify-between">
            <CardHeader class="pb-2">
              <CardTitle class="text-lg">{option.amount} Credits</CardTitle>
            </CardHeader>
            <CardContent class="pb-2">
              <p class="text-2xl font-bold">${option.price.toFixed(2)}</p>
              <p class="text-muted-foreground text-sm">
                ${(option.price / option.amount).toFixed(2)} per credit
              </p>
            </CardContent>
            <CardFooter class="pt-2">
              <Button class="w-full" variant="outline">
                Purchase
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p class="text-muted-foreground mt-8 text-center text-sm">
        Select a credit package to proceed with your purchase. Payment details will be collected on
        the next step.
      </p>
    </div>
  );
}
