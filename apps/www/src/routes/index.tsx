import { Button } from '@/www/components/ui/button';
import { H1, H2, H3, P } from '@/www/components/ui/typography';
import { A, Navigate } from '@solidjs/router';
import { SignedIn, SignedOut } from 'clerk-solidjs';
import { BookOpen, MessageCircle, Search } from 'lucide-solid';
import Logo from '../components/branding/logo';

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <div class='flex min-h-dvh w-full flex-col'>
          {/* Sticky Header */}
          <header class='bg-background/80 sticky top-0 z-50 backdrop-blur-sm'>
            <div class='container flex h-20 items-center justify-between px-4 py-2 sm:py-4'>
              <Logo width={100} class='w-1/2 sm:w-1/4' />
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
                  <H1 class='from-accent-foreground to-primary mb-6 inline-block bg-gradient-to-r bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl'>
                    The AI Study Bible
                  </H1>
                  <H3 class='text-muted-foreground max-w-xl text-lg font-medium sm:text-xl md:text-2xl'>
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
          <div class='from-background to-primary/5 bg-gradient-to-b py-16 sm:py-20 md:py-24'>
            <div class='container mx-auto px-4'>
              <H2 class='mb-8 text-center text-4xl font-bold sm:mb-12 sm:text-5xl'>
                Discover the Power of AI-Assisted Bible Study
              </H2>
              <div class='grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12'>
                {/* Feature 1 */}
                <div class='flex flex-col items-center text-center'>
                  <div class='bg-primary/10 mb-4 rounded-full p-3'>
                    <BookOpen class='text-primary h-6 w-6 sm:h-8 sm:w-8' />
                  </div>
                  <H3 class='mb-2 text-lg font-semibold sm:text-xl'>Deeper Understanding</H3>
                  <P class='text-muted-foreground text-sm sm:text-base'>
                    Explore the Bible with AI-powered insights, highlighting verses, and seamless
                    navigation between translations.
                  </P>
                </div>

                {/* Feature 2 */}
                <div class='flex flex-col items-center text-center'>
                  <div class='bg-primary/10 mb-4 rounded-full p-3'>
                    <MessageCircle class='text-primary h-6 w-6 sm:h-8 sm:w-8' />
                  </div>
                  <H3 class='mb-2 text-lg font-semibold sm:text-xl'>AI Conversations</H3>
                  <P class='text-muted-foreground text-sm sm:text-base'>
                    Engage in meaningful dialogues with AI bots for insightful explanations and
                    interpretations of any verse.
                  </P>
                </div>

                {/* Feature 3 */}
                <div class='flex flex-col items-center text-center'>
                  <div class='bg-primary/10 mb-4 rounded-full p-3'>
                    <Search class='text-primary h-6 w-6 sm:h-8 sm:w-8' />
                  </div>
                  <H3 class='mb-2 text-lg font-semibold sm:text-xl'>Advanced Search</H3>
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
      <SignedIn>
        <Navigate href='/bible' />
      </SignedIn>
    </>
  );
}
