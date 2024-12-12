import { db } from '@/core/database';
import { userSettings } from '@/core/database/schema';
import { UpdateUserSettingSchema } from '@/schemas/users/settings';
import { requireAuth } from '@/www/server/auth';
import { createForm, setValue, setValues, zodForm } from '@modular-forms/solid';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createEffect, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { QueryBoundary } from '../../query-boundary';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '../../ui/switch';

const getSettings = GET(async () => {
  'use server';
  const { user } = requireAuth();
  const settings = await db.query.userSettings.findFirst({
    where: (userSettings, { eq }) => eq(userSettings.userId, user.id),
  });
  return { settings };
});

const updateSettingsAction = action(async (values: z.infer<typeof UpdateUserSettingSchema>) => {
  'use server';
  const { user } = requireAuth();
  const existingSettings = await db.query.userSettings.findFirst({
    where: (userSettings, { eq }) => eq(userSettings.userId, user.id),
  });
  if (!existingSettings) {
    const [newSettings] = await db
      .insert(userSettings)
      .values({
        userId: user.id,
        ...values,
      })
      .returning();
    return { settings: newSettings };
  }

  const [updatedSettings] = await db
    .update(userSettings)
    .set({ ...existingSettings, ...values })
    .where(eq(userSettings.userId, user.id))
    .returning();
  return { settings: updatedSettings };
});

export function SettingsCard() {
  const updateSettings = useAction(updateSettingsAction);

  const settingsQuery = createQuery(() => ({
    queryKey: ['user-settings'],
    queryFn: () => getSettings(),
  }));
  createEffect(() => {
    if (settingsQuery.status === 'success') {
      setValues(form, settingsQuery.data.settings || { emailNotifications: true });
    }
  });

  const [form, { Form, Field }] = createForm<z.infer<typeof UpdateUserSettingSchema>>({
    validate: zodForm(UpdateUserSettingSchema),
    initialValues: settingsQuery.data?.settings || { emailNotifications: true },
  });

  const [toastId, setToastId] = createSignal<string | number>();
  const handleSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof UpdateUserSettingSchema>) => updateSettings(values),
    onMutate: () => {
      setToastId(toast.loading('Updating settings...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      toast.dismiss(toastId());
      toast.success('Settings updated');
    },
    onError: (error) => {
      toast.dismiss(toastId());
      toast.error(error.message);
    },
    onSettled: () => settingsQuery.refetch(),
  }));

  return (
    <Card class='h-full w-full'>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <QueryBoundary query={settingsQuery}>
          {() => (
            <Form
              class='flex flex-col gap-6'
              onSubmit={(values) => handleSubmit.mutateAsync(values)}
            >
              <Field name='emailNotifications' type='boolean'>
                {(field, props) => (
                  <Switch
                    checked={field.value}
                    onChange={(v) => {
                      setValue(form, field.name, v);
                    }}
                    class='flex items-center gap-2'
                  >
                    <SwitchControl {...props}>
                      <SwitchThumb />
                    </SwitchControl>
                    <SwitchLabel>Email Notifications</SwitchLabel>
                  </Switch>
                )}
              </Field>
              <Button type='submit' disabled={form.submitting || form.validating}>
                Save
              </Button>
            </Form>
          )}
        </QueryBoundary>
      </CardContent>
    </Card>
  );
}
