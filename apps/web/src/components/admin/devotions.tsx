import { createMutation } from '@tanstack/solid-query';
import { hasRole } from '@theaistudybible/core/user';
import { tasksQueue } from '@theaistudybible/tasks/queues';
import { auth } from 'clerk-solidjs/server';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TabsContent } from '../ui/tabs';
import { showToast } from '../ui/toast';

const triggerGenerateDevotion = async () => {
  'use server';
  const { sessionClaims } = auth();
  if (!hasRole('admin', sessionClaims)) {
    throw new Error('You must be an admin to access this resource.');
  }

  tasksQueue.add('generate-devotion', null, {
    attempts: 1
  });
};

export const DevotionsContent = () => {
  const triggerDevotionMutation = createMutation(() => ({
    mutationFn: () => triggerGenerateDevotion(),
    onSuccess: () => {
      showToast({
        title: 'Triggered Devotion Generation!'
      });
    },
    onError: () => {
      showToast({
        title: 'Failed to generate devotion',
        variant: 'error'
      });
    }
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
