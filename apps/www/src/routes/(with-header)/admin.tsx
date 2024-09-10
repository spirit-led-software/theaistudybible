import { Tabs, TabsList, TabsTrigger } from '@/www/components/ui/tabs';
import { useIsAdmin } from '@/www/hooks/use-is-admin';
import { Navigate, useLocation, useNavigate } from '@solidjs/router';
import { createMemo, Show, type JSX } from 'solid-js';

export default function AdminLayout(props: { children: JSX.Element }) {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const tab = createMemo(() => location.pathname.split('/').pop());

  return (
    <Show when={isAdmin()} fallback={<Navigate href="/" />}>
      <div class="flex w-full grow flex-col items-center p-5">
        <div class="flex w-full max-w-2xl flex-col gap-3">
          <Tabs
            defaultValue={tab()}
            class="w-full"
            value={tab()}
            onChange={(value) => {
              navigate(`/admin/${value}`);
            }}
          >
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="devotions">Devotions</TabsTrigger>
              <TabsTrigger value="bibles">Bibles</TabsTrigger>
            </TabsList>
          </Tabs>
          {props.children}
        </div>
      </div>
    </Show>
  );
}
