import { Button } from '@/www/components/ui/button';
import { GradientH1, H2, H3, P } from '@/www/components/ui/typography';
import { A, Navigate } from '@solidjs/router';
import { BookOpen, MessageCircle, Search } from 'lucide-solid';
import { SignedIn, SignedOut } from '../../components/auth/control';
import { Logo } from '../../components/branding/logo';
import { LogoSmall } from '../../components/branding/logo-small';

export default function HomePage() {
  return (
    <>
      <SignedIn>
        <Navigate href='/bible' />
      </SignedIn>
      <SignedOut>
        <div class='flex min-h-dvh w-full flex-col'>
          {/* Sticky Header */}
          <header class='sticky top-0 z-50 bg-background/80 backdrop-blur-sm'>
            <div class='container flex h-20 items-center justify-between px-4 py-2 sm:py-4'>
              <LogoSmall width={128} height={64} class='block sm:hidden' />
              <Logo width={256} height={64} class='hidden sm:block' />
              <Button as={A} href='/bible' size='sm' class='text-xs sm:text-sm'>
                Get Started
              </Button>
            </div>
          </header>

          {/* Hero Section */}
          <div class='relative w-full overflow-hidden py-24 sm:py-32 md:py-40 lg:py-56 xl:py-64'>
            <div class='container mx-auto px-10'>
              <div class='flex flex-col items-center space-y-12 md:flex-row md:justify-between md:space-y-0'>
                <div class='text-center md:w-1/2 md:text-left'>
                  <GradientH1 class='mb-6 font-extrabold text-4xl sm:text-5xl md:text-6xl'>
                    The AI Study Bible
                  </GradientH1>
                  <H3 class='max-w-xl font-medium text-lg text-muted-foreground sm:text-xl md:text-2xl'>
                    Unlock Divine Wisdom Anytime, Anywhere with AI-Powered Insights
                  </H3>
                </div>
                <div class='flex w-full flex-col items-center justify-center space-y-4 md:w-1/2 md:items-end'>
                  <Button as={A} href='/bible' size='default' class='w-full max-w-xs'>
                    Start Your Journey
                  </Button>
                  <Button
                    as={A}
                    href='/about'
                    variant='outline'
                    size='default'
                    class='w-full max-w-xs'
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Section */}
          <div class='bg-gradient-to-b from-background to-primary/5 py-16 sm:py-20 md:py-24'>
            <div class='container mx-auto px-4'>
              <H2 class='mb-8 text-center font-bold text-4xl sm:mb-12 sm:text-5xl'>
                Discover the Power of AI-Assisted Bible Study
              </H2>
              <div class='grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12'>
                {/* Feature 1 */}
                <div class='flex flex-col items-center text-center'>
                  <div class='mb-4 rounded-full bg-primary/10 p-3'>
                    <BookOpen class='h-6 w-6 sm:h-8 sm:w-8' />
                  </div>
                  <H3 class='mb-2 font-semibold text-lg sm:text-xl'>Deeper Understanding</H3>
                  <P class='text-muted-foreground text-sm sm:text-base'>
                    Explore the Bible with AI-powered insights, highlighting verses, and seamless
                    navigation between translations.
                  </P>
                </div>

                {/* Feature 2 */}
                <div class='flex flex-col items-center text-center'>
                  <div class='mb-4 rounded-full bg-primary/10 p-3'>
                    <MessageCircle class='h-6 w-6 sm:h-8 sm:w-8' />
                  </div>
                  <H3 class='mb-2 font-semibold text-lg sm:text-xl'>AI Conversations</H3>
                  <P class='text-muted-foreground text-sm sm:text-base'>
                    Engage in meaningful dialogues with AI bots for insightful explanations and
                    interpretations of any verse.
                  </P>
                </div>

                {/* Feature 3 */}
                <div class='flex flex-col items-center text-center'>
                  <div class='mb-4 rounded-full bg-primary/10 p-3'>
                    <Search class='h-6 w-6 sm:h-8 sm:w-8' />
                  </div>
                  <H3 class='mb-2 font-semibold text-lg sm:text-xl'>Advanced Search</H3>
                  <P class='text-muted-foreground text-sm sm:text-base'>
                    Discover interconnected verses with our powerful vector search, uncovering deep
                    semantic relationships.
                  </P>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
