import { Icon } from '@/www/components/branding/icon';
import { Button } from '@/www/components/ui/button';
import { GradientH1, H2, H3, Muted, P } from '@/www/components/ui/typography';
import { useBibleStore } from '@/www/contexts/bible';
import { useProtectAnonymous } from '@/www/hooks/use-protect';
import { A, Navigate } from '@solidjs/router';
import { BookOpen, Languages, MessageCircle, Search, Shield, Star, Sunrise } from 'lucide-solid';
import { For } from 'solid-js';

export default function HomePage() {
  useProtectAnonymous('/bible');

  const [bibleStore] = useBibleStore();
  if (bibleStore.chapter !== null) {
    return <Navigate href='/bible' />;
  }

  return (
    <>
      {/* Hero Section */}
      <div class='relative min-h-full w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32'>
        {/* Add ambient background */}
        <div class='-z-10 absolute inset-0'>
          {/* Base gradient */}
          <div class='absolute inset-0 bg-linear-to-tr from-primary/[0.03] via-accent/[0.03] to-background' />

          {/* Larger, more visible blurred circles */}
          <div class='-right-1/4 absolute top-0 h-[500px] w-[500px] rounded-full bg-[#A2EEFB]/20 blur-[128px]' />
          <div class='-left-1/4 absolute top-1/3 h-[500px] w-[500px] rounded-full bg-[#F9CDF0]/20 blur-[128px]' />
          <div class='absolute top-1/4 right-1/3 h-[400px] w-[400px] rounded-full bg-[#6FECF7]/10 blur-[96px]' />
        </div>

        {/* Icon glow effect */}
        <div class='-z-10 absolute inset-0'>
          {/* Multiple layers of glow */}
          <div class='absolute inset-0 animate-pulse'>
            <div class='absolute inset-0 rounded-full bg-[#6FECF7]/20 blur-3xl' />
          </div>
          <div class='absolute inset-0 animate-pulse [animation-delay:75ms]'>
            <div class='absolute inset-0 rounded-full bg-[#A2EEFB]/15 blur-2xl' />
          </div>
        </div>

        <div class='container mx-auto px-6 sm:px-10'>
          <div class='flex flex-col items-center space-y-8 md:flex-row md:justify-between md:space-y-0'>
            <div class='text-center md:w-1/2 md:text-left'>
              <div class='mb-4 flex items-center justify-center gap-2 md:justify-start'>
                <div class='flex'>
                  <For each={[1, 2, 3, 4, 5]}>
                    {() => <Star class='h-5 w-5 fill-yellow-400 text-yellow-400' />}
                  </For>
                </div>
                <span class='text-muted-foreground text-sm'>Early Access Now Available</span>
              </div>
              <GradientH1 class='mb-6 font-extrabold text-4xl sm:text-5xl md:text-6xl'>
                Transform Your Bible Study with AI
              </GradientH1>
              <H3 class='mb-8 max-w-xl font-medium text-lg text-muted-foreground sm:text-xl md:text-2xl'>
                Get deeper insights, personalized explanations, and discover new connections in
                Scripture - all powered by AI
              </H3>
              <div class='flex flex-col items-center gap-4 md:items-start'>
                <Button
                  as={A}
                  href='/bible'
                  size='lg'
                  class='w-full max-w-xs bg-linear-to-r from-primary to-accent hover:opacity-90'
                >
                  Get Started for Free
                </Button>
                <P class='text-muted-foreground text-sm'>✨ No credit card required</P>
              </div>
            </div>
            <div class='hidden w-full md:block md:w-1/2'>
              <div class='relative flex h-full items-center justify-center'>
                <div class='-z-10 absolute inset-0'>
                  {/* Multiple layers of glow */}
                  <div class='absolute inset-0 animate-pulse'>
                    <div class='absolute inset-0 rounded-full bg-[#6FECF7]/30 blur-3xl' />
                  </div>
                  <div class='absolute inset-0 animate-pulse [animation-delay:75ms]'>
                    <div class='absolute inset-0 rounded-full bg-[#A2EEFB]/20 blur-2xl' />
                  </div>
                </div>
                <Icon class='z-0 w-2/3 max-w-md' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div class='border-y bg-muted/50 py-8'>
        <div class='container mx-auto px-4'>
          <div class='grid grid-cols-2 gap-8 md:grid-cols-3'>
            <div class='flex flex-col items-center justify-center text-center'>
              <Languages class='mb-2 h-6 w-6 text-primary dark:text-foreground' />
              <H3 class='font-bold'>4</H3>
              <P class='text-muted-foreground text-sm'>Bible Translations</P>
              <Muted class='text-xs'>More Soon!</Muted>
            </div>
            <div class='flex flex-col items-center justify-center text-center'>
              <MessageCircle class='mb-2 h-6 w-6 text-primary dark:text-foreground' />
              <H3 class='font-bold'>24/7</H3>
              <P class='text-muted-foreground text-sm'>AI Assistance</P>
            </div>
            <div class='flex flex-col items-center justify-center text-center'>
              <Shield class='mb-2 h-6 w-6 text-primary dark:text-foreground' />
              <H3 class='font-bold'>100%</H3>
              <P class='text-muted-foreground text-sm'>Privacy Focused</P>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div class='bg-linear-to-b from-background to-primary/5 py-16 sm:py-20 md:py-24'>
        <div class='container mx-auto px-4'>
          <H2 class='mb-8 text-center text-4xl sm:mb-12 sm:text-5xl'>
            Discover the Power of AI-Assisted Bible Study
          </H2>
          <div class='grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12'>
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

            {/* Feature 4 */}
            <div class='flex flex-col items-center text-center'>
              <div class='mb-4 rounded-full bg-primary/10 p-3'>
                <Sunrise class='h-6 w-6 sm:h-8 sm:w-8' />
              </div>
              <H3 class='mb-2 font-semibold text-lg sm:text-xl'>Daily Devotions</H3>
              <P class='text-muted-foreground text-sm sm:text-base'>
                Get a daily devotional with a verse of the day, a daily prayer, and a daily
                reflection.
              </P>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div class='bg-primary/5 py-16'>
        <div class='container mx-auto px-4 text-center'>
          <H2 class='mb-6 font-bold text-3xl sm:text-4xl'>
            Be Among the First to Experience AI-Powered Bible Study
          </H2>
          <P class='mb-8 text-muted-foreground'>
            Join our growing community of early adopters transforming their Scripture study with AI
          </P>
          <div class='flex flex-col items-center gap-4'>
            <Button
              as={A}
              href='/bible'
              size='lg'
              class='w-full max-w-xs bg-linear-to-r from-primary to-accent hover:opacity-90'
            >
              Get Started Free
            </Button>
            <Button as={A} href='/about' variant='outline' size='lg' class='w-full max-w-xs'>
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
