import { Button } from '@/www/components/ui/button';
import { Callout, CalloutContent, CalloutTitle } from '@/www/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/www/components/ui/card';
import { GradientH1, H2, Lead, P } from '@/www/components/ui/typography';
import { Link, createFileRoute } from '@tanstack/react-router';
import { BookOpenText, Heart, MessageSquare, Search, ShieldCheck, Sparkles } from 'lucide-react';

export const Route = createFileRoute('/_with-footer/_with-header/about/')({
  head: () => {
    const title = 'About The AI Study Bible - AI-Powered Bible Study Tool';
    const description =
      'Learn how The AI Study Bible combines cutting-edge AI technology with biblical wisdom to provide deeper understanding, meaningful conversations, and advanced search capabilities for your Bible study journey.';
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'og:title', content: title },
        { name: 'og:description', content: description },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
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
      <div className='mx-auto max-w-4xl space-y-12 px-4 py-12'>
        <header className='space-y-4 text-center'>
          <GradientH1>Here's What We Do</GradientH1>
          <Lead className='mx-auto max-w-2xl text-muted-foreground text-xl'>
            Empowering your spiritual journey with cutting-edge AI technology that makes Bible study
            more accessible, engaging, and insightful
          </Lead>
        </header>

        <section>
          <H2 className='mb-6 flex items-center font-semibold text-2xl'>
            <Sparkles className='mr-2 inline-block' />
            Our Features
          </H2>
          <div className='grid gap-8 md:grid-cols-2'>
            {features.map((feature) => (
              <Card
                key={feature.title}
                className='border transition-all hover:border-primary/70 hover:shadow-sm'
              >
                <CardHeader>
                  <CardTitle>
                    <feature.icon className='mr-2 inline-block text-primary dark:text-primary-foreground' />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <P className='text-muted-foreground'>{feature.description}</P>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className='bg-muted'>
          <CardHeader>
            <CardTitle>
              <Heart className='mr-2 inline-block' />
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
          <H2 className='mb-6 text-center font-semibold text-2xl'>Have Questions?</H2>
          <Card>
            <CardContent className='p-6 text-center'>
              <P className='mb-4 text-muted-foreground'>
                Find answers to common questions about our platform, features, pricing, and more on
                our dedicated FAQ page.
              </P>
              <Button variant='outline' className='mx-auto' asChild>
                <Link to='/about/faq'>View Full FAQ</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <Callout
          variant='default'
          className='border-l-primary bg-linear-to-r from-primary/5 to-accent/5 shadow-sm'
        >
          <CalloutTitle className='text-xl'>
            Ready to transform your Bible study experience?
          </CalloutTitle>
          <CalloutContent>
            <P className='mb-4'>
              Join thousands of users who are discovering new insights in Scripture with our
              AI-powered tools.
            </P>
            <div className='flex flex-col justify-center gap-4 sm:flex-row'>
              <Button className='animate-fade-in bg-gradient-to-r from-primary to-accent shadow-md transition-transform hover:scale-105 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/40'>
                <Link to='/pro'>Start Free Trial</Link>
              </Button>
              <Button
                variant='outline'
                className='animate-fade-in border-primary/20 shadow transition-transform [animation-delay:100ms] hover:scale-105 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg dark:border-primary-foreground/50 dark:bg-background/80 dark:text-primary-foreground dark:shadow-primary-foreground/20 dark:hover:border-primary-foreground/70 dark:hover:bg-primary-foreground/10'
              >
                <Link to='/bible'>Start Reading</Link>
              </Button>
            </div>
          </CalloutContent>
        </Callout>
      </div>
    </>
  );
}
