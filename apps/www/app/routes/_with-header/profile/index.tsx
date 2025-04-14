import { InfoCard } from '@/www/components/auth/profile/info-card';
import { LinkedAccountsCard } from '@/www/components/auth/profile/linked-accounts-card';
import { PasskeysCard } from '@/www/components/auth/profile/passkeys-card';
import { SettingsCard } from '@/www/components/auth/profile/settings-card';
import { Card } from '@/www/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/www/components/ui/tabs';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-header/profile/')({
  head: () => {
    const title =
      'Manage Your Profile & Settings | The AI Study Bible - Personalized Bible Study Experience';
    const description =
      'Access and manage your AI Study Bible profile settings. Update your personal information, customize your study preferences, and control your account details for an enhanced Bible study experience.';

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
  return (
    <>
      <div className='container mx-auto px-4 py-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid items-start gap-8 lg:grid-cols-[300px_1fr]'>
            <div className='lg:sticky lg:top-8'>
              <InfoCard />
            </div>

            <div className='min-w-0'>
              <Tabs defaultValue='settings'>
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='settings'>Settings</TabsTrigger>
                  <TabsTrigger value='security'>Security</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' className='mt-6'>
                  <Card className='p-6'>
                    <div className='grid gap-6 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <h3 className='font-medium text-lg'>Recent Activity</h3>
                        <p className='text-muted-foreground text-sm'>
                          Your recent study sessions and interactions.
                        </p>
                        {/* TODO: Implement activity feed */}
                        <div className='rounded-lg border p-4 text-muted-foreground text-sm'>
                          Activity feed coming soon...
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <h3 className='font-medium text-lg'>Study Stats</h3>
                        <p className='text-muted-foreground text-sm'>
                          Your Bible study statistics and progress.
                        </p>
                        {/* TODO: Implement stats */}
                        <div className='rounded-lg border p-4 text-muted-foreground text-sm'>
                          Study statistics coming soon...
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value='settings' className='mt-6'>
                  <SettingsCard />
                </TabsContent>

                <TabsContent value='security' className='mt-6 flex flex-col gap-6'>
                  <LinkedAccountsCard />
                  <PasskeysCard />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
