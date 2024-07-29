import { A, Navigate } from '@solidjs/router';
import { useAuth } from 'clerk-solidjs';
import Icon from '~/components/branding/icon';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { H1, H2, P } from '~/components/ui/typography';

export default function HomePage() {
  const { isSignedIn } = useAuth();

  if (isSignedIn()) {
    return <Navigate href="/bible" />;
  }

  return (
    <div class="flex min-h-dvh w-full flex-col">
      <div class="relative flex h-dvh w-full flex-col items-center justify-center p-5">
        <div
          class="absolute inset-x-0 -top-10 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-accent-foreground to-secondary-foreground opacity-50 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
          ></div>
        </div>
        <H1 class="mb-4 inline-block bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
          The AI Study Bible
        </H1>
        <Icon width={200} class="mb-10" />
        <H2 class="mb-2 max-w-lg border-none text-center">
          Unlock Divine Wisdom Anytime, Anywhere
        </H2>
        <Button as={A} href="/bible">
          Get Started
        </Button>
      </div>
      <div class="flex w-full flex-col items-center space-y-20 px-10 pb-20">
        <Separator class="h-1" />
        <div class="flex max-w-lg flex-col items-center text-center">
          <H2 class="inline-block max-w-sm border-none bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
            Discover a Deeper Understanding with The AI Study Bible
          </H2>
          <P>
            Welcome to The AI Study Bible, the revolutionary app designed to enhance your spiritual
            journey and deepen your understanding of the Bible. Imagine having the entire scripture
            at your fingertips, with the ability to highlight meaningful verses, bookmark favorite
            chapters, and seamlessly navigate between different translations. Our intuitive,
            user-friendly interface makes reading the Bible a truly engaging experience, allowing
            you to focus on the wisdom and guidance within its pages.
          </P>
        </div>
        <Separator class="h-1" />
        <div class="flex max-w-lg flex-col items-center text-center">
          <H2 class="inline-block max-w-sm border-none bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
            Engage in Meaningful Conversations with AI
          </H2>
          <P>
            Ever wished you could have a personal guide to explain the deeper meanings behind Bible
            verses? With The AI Study Bible, you can chat with advanced AI bots trained to provide
            insightful explanations and contextual interpretations of any verse. Whether you're
            seeking clarity on a specific passage or looking for a deeper theological understanding,
            our AI is here to help you explore the richness of the scripture in a way that's
            accessible and enlightening.
          </P>
        </div>
        <Separator class="h-1" />
        <div class="flex max-w-lg flex-col items-center text-center">
          <H2 class="inline-block max-w-sm border-none bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
            Find Connections with Advanced Search
          </H2>
          <P>
            Discover how different parts of the Bible are interconnected with our powerful vector
            search feature. Unlike traditional keyword searches, our advanced technology allows you
            to find semantically related verses, uncovering connections and references that enrich
            your study. Whether you're preparing a sermon, participating in a Bible study group, or
            pursuing personal study, this tool will become an invaluable resource in your spiritual
            toolkit.
          </P>
        </div>
        <Separator class="h-1" />
        <div class="flex max-w-lg flex-col items-center text-center">
          <H2 class="inline-block max-w-sm border-none bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
            Daily Devotions to Inspire and Guide
          </H2>
          <P>
            Start each day with inspiration and guidance through our daily devotions. Every morning,
            The AI Study Bible delivers a carefully selected scripture along with a heartfelt
            devotion to reflect upon. Let these daily messages encourage you, provide wisdom, and
            strengthen your faith as you navigate the challenges and blessings of everyday life.
            Enable push notifications to receive your daily devotion right when you need it, making
            it easier than ever to stay connected to God's word.
          </P>
        </div>
      </div>
    </div>
  );
}
