import { Body } from '@/email/components/body';
import { Head } from '@/email/components/head';
import { Tailwind } from '@/email/components/tailwind';
import type { ForgotPasswordEmailSchema } from '@/email/schemas/auth/forgot-password';
import { Container, Heading, Html, Img, Link, Preview, Text } from '@react-email/components';
import { Resource } from 'sst';
import type { z } from 'zod';

export type ForgotPasswordEmailProps = Omit<z.infer<typeof ForgotPasswordEmailSchema>, 'type'>;

export const ForgotPasswordEmail = ({ code }: ForgotPasswordEmailProps) => {
  return (
    <Html>
      <Head>
        <Preview>Your Password Reset Code</Preview>
      </Head>
      <Tailwind>
        <Body>
          <Container>
            <Img
              src={`${Resource.WebAppUrl.value}/logos/light.png`}
              alt='Logo'
              width={500}
              className='w-1/2'
            />
            <Heading as='h1'>Password Reset Code</Heading>
            <Text>
              Your password reset code is <strong>{code}</strong>
            </Text>
            <Text>
              Click
              <Link
                href={`${Resource.WebAppUrl.value}/reset-password?code=${code}`}
                className='mx-1 hover:underline'
              >
                here
              </Link>
              to reset your password.
            </Text>
            <Text className='text-muted-foreground'>
              Do not share this code with anyone. If you did not request a password reset, please
              ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ForgotPasswordEmail.PreviewProps = {
  code: '123456',
} as ForgotPasswordEmailProps;

export default ForgotPasswordEmail;
