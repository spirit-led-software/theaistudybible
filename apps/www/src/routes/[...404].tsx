import { Button } from '@/www/components/ui/button';
import { H1, H3 } from '@/www/components/ui/typography';
import { A } from '@solidjs/router';

export default function NotFoundPage() {
  return (
    <div class='flex h-full w-full flex-1 flex-col items-center justify-center'>
      <H1 class='mb-4'>404</H1>
      <H3 class='mb-1'>Page not found</H3>
      <Button as={A} href='/'>
        Go to homepage
      </Button>
    </div>
  );
}
