import { Button } from '@/www/components/ui/button';
import { GradientH1, H2, H3, P } from '@/www/components/ui/typography';
import { A } from '@solidjs/router';
import {
  BookOpenText,
  Heart,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-solid';
import type { Component } from 'solid-js';

const AboutPage: Component = () => {
  const features = [
    {
      icon: BookOpenText,
      title: 'Deeper Understanding',
      description:
        'Explore the Bible with AI-powered insights, highlighting verses, and seamless navigation between translations.',
    },
    {
      icon: MessageSquare,
      title: 'AI Conversations',
      description:
        'Engage in meaningful dialogues with AI bots for insightful explanations and interpretations of any verse.',
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description:
        'Discover interconnected verses with our powerful vector search, uncovering deep semantic relationships.',
    },
    {
      icon: Star,
      title: 'Personalized Insights',
      description:
        'Receive tailored study suggestions and devotionals based on your reading history and interests.',
    },
    {
      icon: ShieldCheck,
      title: 'Ethical AI',
      description:
        'Our AI is designed with respect for diverse theological perspectives and adheres to strict ethical guidelines.',
    },
  ];

  return (
    <div class="mx-auto max-w-4xl space-y-12 px-4 py-12">
      <header class="space-y-4 text-center">
        <GradientH1>Here's What We Do</GradientH1>
        <P class="text-muted-foreground text-xl">
          Empowering your spiritual journey with cutting-edge AI technology
        </P>
      </header>

      <section>
        <H2 class="mb-6 flex items-center text-2xl font-semibold">
          <Sparkles class="mr-2 inline-block" />
          Our Features
        </H2>
        <div class="grid gap-8 md:grid-cols-2">
          {features.map((feature) => (
            <div class="rounded-lg bg-white p-6 shadow-md">
              <H3 class="mb-2 flex items-center text-xl font-semibold">
                <feature.icon class="mr-2 inline-block" />
                {feature.title}
              </H3>
              <P class="text-muted-foreground">{feature.description}</P>
            </div>
          ))}
        </div>
      </section>

      <section class="rounded-lg bg-gray-100 p-8">
        <H2 class="mb-4 flex items-center text-2xl font-semibold">
          <Heart class="mr-2 inline-block" />
          Our Mission
        </H2>
        <p class="mb-4">
          At The AI Study Bible, we're committed to bridging the gap between ancient wisdom and
          modern technology. Our mission is to make Bible study more accessible, engaging, and
          insightful for everyone, from seasoned theologians to curious newcomers.
        </p>
        <p>
          We believe that by harnessing the power of AI, we can unlock new dimensions of
          understanding and help people connect with scripture in profound and personal ways.
        </p>
      </section>

      <div class="flex justify-center">
        <Button as={A} href="/bible" class="px-6 py-3 text-lg">
          Start Your Journey
        </Button>
      </div>
    </div>
  );
};

export default AboutPage;
