import { Logo } from '@/www/components/branding/logo';
import { Logo as SpiritLedSoftwareLogo } from '@/www/components/branding/spirit-led-software/logo';
import { GitHub } from '@/www/components/ui/brand-icons';
import { Button } from '@/www/components/ui/button';
import { Separator } from '@/www/components/ui/separator';
import { A } from '@solidjs/router';
import { Copyright } from 'lucide-solid';

export const NavigationFooter = () => {
  return (
    <footer class='standalone:hidden bg-muted/30 py-8 text-muted-foreground sm:py-12'>
      <div class='container mx-auto px-4'>
        <div class='mb-6 flex flex-col items-center sm:mb-8'>
          <Logo class='mb-4 h-8 sm:h-12' />
          <div class='mb-4 text-center text-xs sm:text-sm'>
            <Copyright class='mr-1 inline-block' /> {new Date().getFullYear()} Spirit-Led Software.
            All rights reserved.
          </div>
        </div>

        <Separator class='my-6 h-[2px] bg-primary/20 sm:my-8' />

        <div class='flex flex-col items-center'>
          <div class='mb-6 flex flex-col items-center space-y-4 sm:mb-8 sm:flex-row sm:space-x-4 sm:space-y-0'>
            <Button variant='link' size='sm' as={A} href='/about'>
              About
            </Button>
            <Button variant='link' size='sm' as='a' href='mailto:support@theaistudybible.com'>
              Contact
            </Button>
            <Button
              variant='link'
              size='sm'
              as={A}
              href='https://donate.stripe.com/cN23fc1mFdW2dXOcMM'
              target='_blank'
              rel='noopener noreferrer'
            >
              Donate
            </Button>
            <Button variant='link' size='sm' as={A} href='/privacy'>
              Privacy Policy
            </Button>
            <Button variant='link' size='sm' as={A} href='/terms'>
              Terms of Service
            </Button>
            <Button
              variant='link'
              size='sm'
              as='a'
              href='https://github.com/spirit-led-software/theaistudybible'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GitHub class='mr-1 inline-block size-4 sm:size-6' />
              GitHub
            </Button>
          </div>
          <A href='https://spiritledsoftware.com' target='_blank'>
            <SpiritLedSoftwareLogo class='h-6 sm:h-8' />
          </A>
        </div>
      </div>
    </footer>
  );
};
