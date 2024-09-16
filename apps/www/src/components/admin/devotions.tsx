import { generateDevotion } from '@/ai/devotion';
import { auth } from '@/www/server/auth';
import { createMutation } from '@tanstack/solid-query';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

const triggerGenerateDevotion = async () => {
  'use server';
  const { roles } = auth();
  if (roles?.some((role) => role.id === 'admin')) {
    throw new Error('You must be an admin to access this resource.');
  }
  return await generateDevotion();
};

export const DevotionsContent = () => {
  const [toastId, setToastId] = createSignal<string | number>();

  const triggerDevotionMutation = createMutation(() => ({
    mutationFn: () => triggerGenerateDevotion(),
    onMutate: () => {
      setToastId(toast.loading('Generating...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      toast.dismiss(toastId());
      toast.success('Devotion generated!');
    },
    onError: (error) => {
      toast.dismiss(toastId());
      toast.error(error.message);
    },
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Devotion</CardTitle>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Button onClick={() => triggerDevotionMutation.mutate()}>Generate</Button>
      </CardFooter>
    </Card>
  );
};
