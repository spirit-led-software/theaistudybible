import { Tabs, TabsList, TabsTrigger } from '@/www/components/ui/tabs';
import { Navigate, useLocation, useNavigate } from '@solidjs/router';
import { type JSX, Show, createMemo } from 'solid-js';
import { useAuth } from '../contexts/auth';
import { WithHeaderLayout } from './with-header';

export function AdminLayout(props: { children: JSX.Element }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tab = createMemo(() => location.pathname.split('/').pop());

  return (
    <WithHeaderLayout>
      <Show when={isAdmin()} fallback={<Navigate href='/' />}>
        <div class='flex w-full grow flex-col items-center p-5'>
          <div class='flex w-full max-w-2xl flex-col gap-3'>
            <Tabs
              defaultValue={tab()}
              class='w-full'
              value={tab()}
              onChange={(value) => {
                navigate(`/admin/${value}`);
              }}
            >
              <TabsList class='grid w-full grid-cols-2'>
                <TabsTrigger value='devotions'>Devotions</TabsTrigger>
                <TabsTrigger value='bibles'>Bibles</TabsTrigger>
              </TabsList>
            </Tabs>
            {props.children}
          </div>
        </div>
      </Show>
    </WithHeaderLayout>
  );
}
