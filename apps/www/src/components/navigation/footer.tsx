import { Logo } from '@/www/components/branding/logo';
import { Logo as SpiritLedSoftwareLogo } from '@/www/components/branding/spirit-led-software/logo';
import { GitHub } from '@/www/components/ui/brand-icons';
import { Button } from '@/www/components/ui/button';
import { Separator } from '@/www/components/ui/separator';
import { A } from '@solidjs/router';
import { Copyright } from 'lucide-solid';

export const NavigationFooter = () => {
  return (
    <footer class='bg-muted/30 py-12 text-muted-foreground'>
      <div class='container mx-auto px-4'>
        <div class='mb-8 flex flex-col items-center'>
          <Logo class='mb-4 h-12' />
          <div class='mb-4 text-sm'>
            <Copyright class='mr-1 inline-block' /> {new Date().getFullYear()} Spirit-Led Software.
            All rights reserved.
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
            <Button
              variant='link'
              size='sm'
              as='a'
              href='https://github.com/spirit-led-software/theaistudybible'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GitHub class='mr-1 inline-block size-6' />
              GitHub
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
