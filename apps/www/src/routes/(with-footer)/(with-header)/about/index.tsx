import { Button } from '@/www/components/ui/button';
import { Callout, CalloutContent, CalloutTitle } from '@/www/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/www/components/ui/card';
import { GradientH1, H2, Lead, P } from '@/www/components/ui/typography';
import { Meta, Title } from '@solidjs/meta';
import { A } from '@solidjs/router';
import { BookOpenText, MessageSquare, Search, ShieldCheck, Sparkles } from 'lucide-solid';
import { Heart } from 'lucide-solid';
import { For } from 'solid-js';

export default function AboutPage() {
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
      icon: ShieldCheck,
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
    <>
      <MetaTags />
      <div class='mx-auto max-w-4xl space-y-12 px-4 py-12'>
        <header class='space-y-4 text-center'>
          <GradientH1>Here's What We Do</GradientH1>
          <Lead class='mx-auto max-w-2xl text-muted-foreground text-xl'>
            Empowering your spiritual journey with cutting-edge AI technology that makes Bible study
            more accessible, engaging, and insightful
          </Lead>
        </header>

        <section>
          <H2 class='mb-6 flex items-center font-semibold text-2xl'>
            <Sparkles class='mr-2 inline-block' />
            Our Features
          </H2>
          <div class='grid gap-8 md:grid-cols-2'>
            <For each={features}>
              {(feature) => (
                <Card class='border transition-all hover:border-primary/70 hover:shadow-sm'>
                  <CardHeader>
                    <CardTitle>
                      <feature.icon class='mr-2 inline-block text-primary dark:text-primary-foreground' />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <P class='text-muted-foreground'>{feature.description}</P>
                  </CardContent>
                </Card>
              )}
            </For>
          </div>
        </section>

        <Card class='bg-muted'>
          <CardHeader>
            <CardTitle>
              <Heart class='mr-2 inline-block' />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <P>
              At The AI Study Bible, we're committed to bridging the gap between ancient wisdom and
              modern technology. Our mission is to make Bible study more accessible, engaging, and
              insightful for everyone, from seasoned theologians to curious newcomers.
            </P>
            <P>
              We believe that by harnessing the power of AI, we can unlock new dimensions of
              understanding and help people connect with scripture in profound and personal ways.
            </P>
          </CardContent>
        </Card>

        {/* FAQ Section - Simplified with link */}
        <section>
          <H2 class='mb-6 text-center font-semibold text-2xl'>Have Questions?</H2>
          <Card>
            <CardContent class='p-6 text-center'>
              <P class='mb-4 text-muted-foreground'>
                Find answers to common questions about our platform, features, pricing, and more on
                our dedicated FAQ page.
              </P>
              <Button as={A} href='/about/faq' variant='outline' class='mx-auto'>
                View Full FAQ
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <Callout
          variant='default'
          class='border-l-primary bg-linear-to-r from-primary/5 to-accent/5 shadow-sm'
        >
          <CalloutTitle class='text-xl'>
            Ready to transform your Bible study experience?
          </CalloutTitle>
          <CalloutContent>
            <P class='mb-4'>
              Join thousands of users who are discovering new insights in Scripture with our
              AI-powered tools.
            </P>
            <div class='flex flex-col justify-center gap-4 sm:flex-row'>
              <Button
                as={A}
                href='/pro'
                class='animate-fade-in bg-gradient-to-r from-primary to-accent shadow-md transition-transform hover:scale-105 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/40'
              >
                Start Free Trial
              </Button>
              <Button
                as={A}
                href='/bible'
                variant='outline'
                class='animate-fade-in border-primary/20 shadow transition-transform [animation-delay:100ms] hover:scale-105 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg dark:border-primary-foreground/50 dark:bg-background/80 dark:text-primary-foreground dark:shadow-primary-foreground/20 dark:hover:border-primary-foreground/70 dark:hover:bg-primary-foreground/10'
              >
                Start Reading
              </Button>
            </div>
          </CalloutContent>
        </Callout>
      </div>
    </>
  );
}

const MetaTags = () => {
  const title = 'About The AI Study Bible - AI-Powered Bible Study Tool';
  const description =
    'Learn how The AI Study Bible combines cutting-edge AI technology with biblical wisdom to provide deeper understanding, meaningful conversations, and advanced search capabilities for your Bible study journey.';

  return (
    <>
      <Title>{title}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title} />
      <Meta property='og:description' content={description} />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
