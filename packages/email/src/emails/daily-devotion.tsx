import { toTitleCase } from '@/core/utils/string';
import { Body } from '@/email/components/body';
import { Head } from '@/email/components/head';
import { Tailwind } from '@/email/components/tailwind';
import type { DailyDevotionEmailSchema } from '@/email/schemas/daily-devotion';
import {
  Button,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { formatDate } from 'date-fns';
import { Resource } from 'sst';
import type { z } from 'zod';
import { Markdown } from '../components/markdown';

export type DailyDevotionEmailProps = Omit<z.infer<typeof DailyDevotionEmailSchema>, 'type'>;

export const DailyDevotionEmail = ({ devotion, devotionImage }: DailyDevotionEmailProps) => {
  return (
    <Html>
      <Head>
        <Preview>Today's Devotion Has Arrived!</Preview>
      </Head>
      <Tailwind>
        <Body>
          <Container>
            <Img
              src={`${Resource.WebAppUrl.value}/logos/light.png`}
              alt='Logo'
              width={512}
              className='w-1/2'
            />
            <Section>
              <Heading as='h1' className='my-2'>
                Today's Devotion:{' '}
                <span className='font-goldman text-accent-foreground'>
                  {toTitleCase(devotion.topic)}
                </span>
              </Heading>
              <Row className='w-full'>
                <Column>
                  <Heading as='h3' className='my-2 text-muted-foreground'>
                    {formatDate(devotion.createdAt, 'MMMM d, yyyy')}
                  </Heading>
                </Column>
                <Column className='flex justify-end'>
                  <Button
                    href={`${Resource.WebAppUrl.value}/devotion/${devotion.id}`}
                    className='w-fit rounded-full bg-primary px-2 py-1 text-primary-foreground text-sm hover:bg-primary/90'
                  >
                    Read on the Web
                  </Button>
                </Column>
              </Row>
            </Section>
            {devotionImage.url && (
              <Img
                src={devotionImage.url}
                alt={devotionImage.caption ?? 'Devotion Image'}
                width={1024}
                className='mt-2 h-auto w-full rounded'
              />
            )}
            <Heading as='h2'>Bible Reading</Heading>
            <Text>{devotion.bibleReading}</Text>
            <Heading as='h2'>Summary</Heading>
            <Text>{devotion.summary}</Text>
            <Text>
              <Markdown>{devotion.summary}</Markdown>
            </Text>
            <Heading as='h2'>Reflection</Heading>
            <Text>
              <Markdown>{devotion.reflection}</Markdown>
            </Text>
            <Heading as='h2'>Prayer</Heading>
            <Text>
              <Markdown>{devotion.prayer}</Markdown>
            </Text>
            <Container className='my-5 flex flex-col items-center'>
              <Heading as='h2' className='text-center'>
                Dive Deeper
              </Heading>
              <div className='flex justify-center'>
                <div className='grid grid-cols-2 gap-2'>
                  {devotion.diveDeeperQueries.map((query) => (
                    <Button
                      key={query}
                      href={`${Resource.WebAppUrl.value}/chat?query=${query}`}
                      className='w-fit rounded-full bg-primary p-4 text-primary-foreground hover:bg-primary/90'
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            </Container>
            <Container>
              <Text className='text-muted-foreground text-xs'>
                If you have any questions or feedback, please reply to this email.
                <br />
                If you no longer wish to receive these emails, you can edit your settings{' '}
                <Link href={`${Resource.WebAppUrl.value}/profile`}>here</Link>.
              </Text>
            </Container>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

DailyDevotionEmail.PreviewProps = {
  devotion: {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    failed: false,
    topic: 'Love',
    bibleReading:
      '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16',
    summary: `# This is a summary

## This is a subheading

This is a paragraph`,
    reflection: 'This is a reflection',
    prayer: 'This is a prayer',
    diveDeeperQueries: ['What is love?', 'How do I love?'],
  },
  devotionImage: {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    devotionId: '1',
    prompt: 'This is a prompt',
    negativePrompt: 'This is a negative prompt',
    caption: 'This is a caption',
    url: 'https://picsum.photos/1024/512',
  },
} as DailyDevotionEmailProps;

export default DailyDevotionEmail;
