import { Protected } from '@/www/components/auth/control';
import { InfoCard } from '@/www/components/auth/profile/info-card';
import { PasskeysCard } from '@/www/components/auth/profile/passkeys-card';
import { SettingsCard } from '@/www/components/auth/profile/settings-card';
import { Card } from '@/www/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/www/components/ui/tabs';
import { Meta, Title } from '@solidjs/meta';
import { Navigate } from '@solidjs/router';

export default function Profile() {
  return (
    <Protected
      signedOutFallback={
        <Navigate href={`/sign-in?redirectUrl=${encodeURIComponent('/profile')}`} />
      }
    >
      <MetaTags />
      <div class='container mx-auto px-4 py-8'>
        <div class='mx-auto max-w-7xl'>
          <div class='grid items-start gap-8 lg:grid-cols-[300px_1fr]'>
            <div class='lg:sticky lg:top-8'>
              <InfoCard />
            </div>

            <div class='min-w-0'>
              <Tabs defaultValue='settings'>
                <TabsList class='grid w-full grid-cols-3'>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='settings'>Settings</TabsTrigger>
                  <TabsTrigger value='security'>Security</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' class='mt-6'>
                  <Card class='p-6'>
                    <div class='grid gap-6 md:grid-cols-2'>
                      <div class='space-y-2'>
                        <h3 class='font-medium text-lg'>Recent Activity</h3>
                        <p class='text-muted-foreground text-sm'>
                          Your recent study sessions and interactions.
                        </p>
                        {/* TODO: Implement activity feed */}
                        <div class='rounded-lg border p-4 text-muted-foreground text-sm'>
                          Activity feed coming soon...
                        </div>
                      </div>
                      <div class='space-y-2'>
                        <h3 class='font-medium text-lg'>Study Stats</h3>
                        <p class='text-muted-foreground text-sm'>
                          Your Bible study statistics and progress.
                        </p>
                        {/* TODO: Implement stats */}
                        <div class='rounded-lg border p-4 text-muted-foreground text-sm'>
                          Study statistics coming soon...
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value='settings' class='mt-6'>
                  <SettingsCard />
                </TabsContent>

                <TabsContent value='security' class='mt-6'>
                  <PasskeysCard />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Protected>
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
