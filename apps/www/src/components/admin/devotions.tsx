import { hasRole } from '@/core/user';
import { createMutation } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { toast } from 'solid-sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TabsContent } from '../ui/tabs';

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
    <TabsContent value="devotions">
      <Card>
        <CardHeader>
          <CardTitle>Generate Devotion</CardTitle>
          <CardDescription>Generate a devotion for today</CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter>
          <Button onClick={() => triggerDevotionMutation.mutate()}>Generate</Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
};
