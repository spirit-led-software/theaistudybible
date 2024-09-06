import { Tabs, TabsList, TabsTrigger } from '@/www/components/ui/tabs';
import { useLocation, useNavigate } from '@solidjs/router';
import type { JSX } from 'solid-js';

export default function AdminLayout({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div class="flex w-full grow flex-col items-center p-5">
      <div class="flex w-full max-w-2xl flex-col gap-3">
        <Tabs
          defaultValue="devotions"
          class="w-full"
          value={location.pathname.substring(location.pathname.lastIndexOf('/') + 1)}
          onChange={(value) => {
            navigate(`/admin/${value}`);
          }}
        >
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="devotions">Devotions</TabsTrigger>
            <TabsTrigger value="bibles">Bibles</TabsTrigger>
          </TabsList>
        </Tabs>
        {children}
      </div>
    </div>
  );
}
