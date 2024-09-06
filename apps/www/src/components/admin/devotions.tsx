import { hasRole } from '@/core/user';
import { createMutation } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { toast } from 'solid-sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

const triggerGenerateDevotion = async () => {
  'use server';
  const { sessionClaims } = auth();
  if (!hasRole('admin', sessionClaims)) {
    throw new Error('You must be an admin to access this resource.');
  }
  return Promise.resolve();
};

export const DevotionsContent = () => {
  const triggerDevotionMutation = createMutation(() => ({
    mutationFn: () => triggerGenerateDevotion(),
    onSuccess: () => {
      toast.success('Triggered Devotion Generation!');
    },
    onError: () => {
      toast.error('Failed to generate devotion');
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
