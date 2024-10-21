import { Logo } from '@/www/components/branding/logo';
import { Logo as SpiritLedSoftwareLogo } from '@/www/components/branding/spirit-led-software/logo';
import { Button } from '@/www/components/ui/button';
import { Separator } from '@/www/components/ui/separator';
import { A } from '@solidjs/router';

export const NavigationFooter = () => {
  return (
    <footer class='bg-muted/30 py-12 text-muted-foreground'>
      <div class='container mx-auto px-4'>
        <div class='mb-8 flex flex-col items-center'>
          <Logo class='mb-4 h-12' />
          <div class='mb-4 text-sm'>
            © {new Date().getFullYear()} The AI Study Bible. All rights reserved.
          </div>
        </div>

        <Separator class='my-8 h-[2px] bg-primary/20' />

        <div class='flex flex-col items-center'>
          <div class='mb-8 flex items-center space-x-4'>
            <Button variant='link' size='sm' as={A} href='/about'>
              About
            </Button>
            <Button variant='link' size='sm' as='a' href='mailto:support@theaistudybible.com'>
              Contact
            </Button>
            <Button variant='link' size='sm' as={A} href='/privacy'>
              Privacy Policy
            </Button>
            <Button variant='link' size='sm' as={A} href='/terms'>
              Terms of Service
            </Button>
          </div>
          <A href='https://spiritledsoftware.com' target='_blank'>
            <SpiritLedSoftwareLogo class='h-8' />
          </A>
        </div>
      </div>
    </footer>
  );
};
