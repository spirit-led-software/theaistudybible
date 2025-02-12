import { Logo } from '@/www/components/branding/logo';
import { Logo as SpiritLedSoftwareLogo } from '@/www/components/branding/spirit-led-software/logo';
import { GitHub } from '@/www/components/ui/brand-icons';
import { Button } from '@/www/components/ui/button';
import { Separator } from '@/www/components/ui/separator';
import { A } from '@solidjs/router';
import { Copyright } from 'lucide-solid';

export const NavigationFooter = () => {
  return (
    <footer class='standalone:hidden bg-muted/30 py-2 text-muted-foreground sm:py-4'>
      <div class='container mx-auto px-4'>
        <div class='mb-6 flex flex-col items-center'>
          <Logo class='mb-4 h-8 sm:h-12' />
          <div class='mb-4 flex items-center gap-2 text-center text-xs sm:text-sm'>
            <Copyright class='inline-block' /> {new Date().getFullYear()}{' '}
            <A href='https://spiritledsoftware.com' target='_blank' class='inline-block'>
              <SpiritLedSoftwareLogo class='h-5 sm:h-6' />
            </A>
            All rights reserved.
          </div>
        </div>

        <Separator class='my-4 h-[2px] bg-primary/20' />

        <div class='flex flex-col items-center gap-3'>
          <div class='grid grid-cols-3 xs:grid-cols-2 gap-2 text-center text-sm sm:flex sm:gap-2'>
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
              href={import.meta.env.PUBLIC_DONATION_LINK}
              target='_blank'
              rel='noopener noreferrer'
            >
              Donate
            </Button>
            <Button variant='link' size='sm' as={A} href='/privacy'>
              Privacy
            </Button>
            <Button variant='link' size='sm' as={A} href='/terms'>
              Terms
            </Button>
            <Button
              variant='link'
              size='sm'
              as='a'
              href='https://github.com/spirit-led-software/theaistudybible'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GitHub class='mr-1 inline-block size-3' />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};
