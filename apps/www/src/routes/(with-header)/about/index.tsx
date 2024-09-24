import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/www/components/ui/card';
import { GradientH1, H2, P } from '@/www/components/ui/typography';
import { AboutLayout } from '@/www/layouts/about';
import { A } from '@solidjs/router';
import { BookOpenText, MessageSquare, Search, ShieldCheck, Sparkles, Star } from 'lucide-solid';
import { Heart } from 'lucide-solid';

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
    <AboutLayout>
      <div class='mx-auto max-w-4xl space-y-12 px-4 py-12'>
        <header class='space-y-4 text-center'>
          <GradientH1>Here's What We Do</GradientH1>
          <P class='text-muted-foreground text-xl'>
            Empowering your spiritual journey with cutting-edge AI technology
          </P>
        </header>

        <section>
          <H2 class='mb-6 flex items-center font-semibold text-2xl'>
            <Sparkles class='mr-2 inline-block' />
            Our Features
          </H2>
          <div class='grid gap-8 md:grid-cols-2'>
            {features.map((feature) => (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <feature.icon class='mr-2 inline-block' />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <P class='text-muted-foreground'>{feature.description}</P>
                </CardContent>
              </Card>
            ))}
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

        <div class='flex justify-center'>
          <Button as={A} href='/bible' class='px-6 py-3 text-lg'>
            Start Your Journey
          </Button>
        </div>
      </div>
    </AboutLayout>
  );
}
