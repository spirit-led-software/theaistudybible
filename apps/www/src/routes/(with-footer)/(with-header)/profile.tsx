import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { InfoCard } from '@/www/components/auth/profile/info-card';
import { PasskeysCard } from '@/www/components/auth/profile/passkeys-card';
import { SettingsCard } from '@/www/components/auth/profile/settings-card';
import { Meta, Title } from '@solidjs/meta';
import { Navigate } from '@solidjs/router';

export default function Profile() {
  return (
    <>
      <SignedIn>
        <MetaTags />
        <div class='container flex flex-col items-center justify-center gap-4 p-4 sm:p-6 md:grid md:grid-cols-2 md:p-10'>
          <InfoCard />
          <PasskeysCard />
          <SettingsCard />
        </div>
      </SignedIn>
      <SignedOut>
        <Navigate href='/sign-in' />
      </SignedOut>
    </>
  );
}

const MetaTags = () => {
  const title =
    'Manage Your Profile & Settings | The AI Study Bible - Personalized Bible Study Experience';
  const description =
    'Access and manage your AI Study Bible profile settings. Update your personal information, customize your study preferences, and control your account details for an enhanced Bible study experience.';

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
