import { DevotionsContent } from '~/components/admin/devotions';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { H1 } from '~/components/ui/typography';

const AdminPage = () => {
  return (
    <div class="flex w-full grow flex-col items-center p-5">
      <div class="flex w-full max-w-2xl flex-col gap-3">
        <H1 class="text-center">Administration</H1>
        <Tabs defaultValue="devotions" class="w-full">
          <TabsList class="grid w-full grid-cols-1">
            <TabsTrigger value="devotions">Devotions</TabsTrigger>
          </TabsList>
          <DevotionsContent />
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
