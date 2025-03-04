import { db } from '@/core/database';
import { userSettings } from '@/core/database/schema';
import { UpdateUserSettingsSchema } from '@/schemas/users/settings';
import { useAuth } from '@/www/hooks/use-auth';
import { requireAuth } from '@/www/server/utils/auth';
import { createForm, setValue, zodForm } from '@modular-forms/solid';
import { action, useAction } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { SmallBiblePicker } from '../../bible/small-bible-picker';
import { PushNotificationToggle } from '../../push-notification-toggle';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '../../ui/switch';
import {
  TextField,
  TextFieldDescription,
  TextFieldLabel,
  TextFieldTextArea,
} from '../../ui/text-field';

const updateSettingsAction = action(async (values: z.infer<typeof UpdateUserSettingsSchema>) => {
  'use server';
  const { user } = requireAuth();
  let settings = await db.query.userSettings.findFirst({
    where: (userSettings, { eq }) => eq(userSettings.userId, user.id),
  });
  if (settings) {
    [settings] = await db
      .update(userSettings)
      .set(values)
      .where(eq(userSettings.userId, user.id))
      .returning();
  } else {
    [settings] = await db
      .insert(userSettings)
      .values({ userId: user.id, ...values })
      .returning();
  }
  return { settings };
});

export function SettingsCard() {
  const updateSettings = useAction(updateSettingsAction);

  const { settings, refetch } = useAuth();

  const [form, { Form, Field }] = createForm<z.infer<typeof UpdateUserSettingsSchema>>({
    validate: zodForm(UpdateUserSettingsSchema),
    initialValues: settings() || { emailNotifications: true },
  });

  const [toastId, setToastId] = createSignal<string | number>();
  const handleSubmit = createMutation(() => ({
    mutationFn: (values: z.infer<typeof UpdateUserSettingsSchema>) => updateSettings(values),
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
    onSettled: () => refetch(),
  }));

  return (
    <Card class='flex h-full w-full flex-col'>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent class='flex h-full w-full flex-1 flex-col'>
        <Form
          class='flex grow flex-col gap-6'
          onSubmit={(values) => handleSubmit.mutateAsync(values)}
        >
          <div class='flex h-full flex-1 flex-col gap-6'>
            <div class='flex items-center gap-12'>
              <div class='flex flex-col gap-6'>
                <PushNotificationToggle />
                <Field name='emailNotifications' type='boolean'>
                  {(field, props) => (
                    <Switch
                      checked={field.value}
                      onChange={(v) => {
                        setValue(form, field.name, v);
                      }}
                      class='flex items-center gap-2'
                    >
                      <SwitchLabel>Email Notifications</SwitchLabel>
                      <SwitchControl {...props}>
                        <SwitchThumb />
                      </SwitchControl>
                    </Switch>
                  )}
                </Field>
              </div>
              <Field name='preferredBibleAbbreviation'>
                {(field) => (
                  <div class='flex flex-col gap-2'>
                    <Label>Preferred Bible</Label>
                    <SmallBiblePicker
                      value={field.value ?? undefined}
                      onValueChange={(b) => setValue(form, field.name, b?.abbreviation)}
                      class='w-fit'
                    />
                  </div>
                )}
              </Field>
            </div>
            <Field name='aiInstructions'>
              {(field, props) => (
                <TextField
                  value={field.value ?? undefined}
                  onChange={(v) => setValue(form, field.name, v)}
                  validationState={field.error ? 'invalid' : 'valid'}
                >
                  <TextFieldLabel>Added AI Instructions</TextFieldLabel>
                  <TextFieldDescription>
                    These instructions will be added to the AI's system prompt.
                  </TextFieldDescription>
                  <TextFieldTextArea {...props} rows={4} class='resize-none' />
                </TextField>
              )}
            </Field>
          </div>
          <div class='flex justify-end'>
            <Button type='submit' disabled={form.submitting || form.validating}>
              Save
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
