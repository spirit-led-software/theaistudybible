import { generateDevotion } from '@/ai/devotion';
import { requireAdminMiddleware } from '@/www/server/middleware/auth';
import { useMutation } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

const triggerGenerateDevotion = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .handler(async () => {
    const devotion = await generateDevotion();
    return { devotion };
  });

export const DevotionsContent = () => {
  const [toastId, setToastId] = useState<string | number>();

  const triggerDevotionMutation = useMutation({
    mutationFn: () => triggerGenerateDevotion(),
    onMutate: () => {
      setToastId(toast.loading('Generating...', { duration: Number.POSITIVE_INFINITY }));
    },
    onSuccess: () => {
      toast.dismiss(toastId);
      toast.success('Devotion generated!');
    },
    onError: (error) => {
      toast.dismiss(toastId);
      toast.error(error.message);
    },
  });

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
