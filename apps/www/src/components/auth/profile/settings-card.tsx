import { cache } from '@/core/cache';
import { db } from '@/core/database';
import { userSettings } from '@/core/database/schema';
import { UpdateUserSettingsSchema } from '@/schemas/users/settings';
import { useAuth } from '@/www/contexts/auth';
import { requireAuth } from '@/www/server/auth';
import { createForm, setValue, zodForm } from '@modular-forms/solid';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { PushNotificationToggle } from '../../push-notification-toggle';
import { QueryBoundary } from '../../query-boundary';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '../../ui/switch';
import {
  TextField,
  TextFieldDescription,
  TextFieldLabel,
  TextFieldTextArea,
} from '../../ui/text-field';

const getBibles = GET(async () => {
  'use server';
  const bibles = await db.query.bibles.findMany({ columns: { id: true, abbreviationLocal: true } });
  return bibles;
});

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
  await cache.del(`settings:${user.id}`);
  return { settings };
});

export function SettingsCard() {
  const updateSettings = useAction(updateSettingsAction);

  const biblesQuery = createQuery(() => ({
    queryKey: ['bibles'],
    queryFn: () => getBibles(),
  }));

  const { settings, invalidate } = useAuth();

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
    onSettled: () => invalidate(),
  }));

  return (
    <Card class='flex h-full w-full flex-col'>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent class='flex h-full w-full flex-1 flex-col'>
        <Form
          class='flex flex-grow flex-col gap-6'
          onSubmit={(values) => handleSubmit.mutateAsync(values)}
        >
          <div class='flex h-full flex-1 flex-col gap-6'>
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
                  <SwitchControl {...props}>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>Email Notifications</SwitchLabel>
                </Switch>
              )}
            </Field>
            <Field name='preferredBibleId'>
              {(field, props) => (
                <div class='flex flex-col gap-2'>
                  <Label>Preferred Bible</Label>
                  <QueryBoundary
                    query={biblesQuery}
                    loadingFallback={
                      <Button class='w-fit' disabled>
                        Loading...
                      </Button>
                    }
                  >
                    {(bibles) => (
                      <Select
                        value={bibles.find((bible) => bible.id === field.value)}
                        onChange={(v) => setValue(form, field.name, v?.id)}
                        options={bibles}
                        optionValue={(bible) => bible.id}
                        itemComponent={(props) => (
                          <SelectItem item={props.item}>
                            {props.item.rawValue.abbreviationLocal}
                          </SelectItem>
                        )}
                        placeholder='Select a Bible'
                      >
                        <SelectTrigger class='w-fit min-w-24' {...props}>
                          <SelectValue<(typeof bibles)[number]>>
                            {(props) => props.selectedOption()?.abbreviationLocal}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    )}
                  </QueryBoundary>
                </div>
              )}
            </Field>
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
