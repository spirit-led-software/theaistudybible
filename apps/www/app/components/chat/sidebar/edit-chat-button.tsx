import { db } from '@/core/database';
import { chats } from '@/core/database/schema';
import type { Chat } from '@/schemas/chats/types';
import { Button } from '@/www/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/www/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/www/components/ui/form';
import { Input } from '@/www/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Define schema for edit chat form
const editChatSchema = z.object({
  name: z.string().min(1, { message: 'Chat name is required.' }),
});

const editChat = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      chatId: z.string(),
      name: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const [chat] = await db
      .update(chats)
      .set({
        name: data.name,
        customName: true,
      })
      .where(and(eq(chats.userId, 'user.id'), eq(chats.id, data.chatId)))
      .returning();
    return { chat };
  });

export type EditChatButtonProps = {
  chat: Chat;
};

export const EditChatButton = (props: EditChatButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof editChatSchema>>({
    resolver: zodResolver(editChatSchema),
    defaultValues: {
      name: props.chat.name,
    },
  });

  const editChatMutation = useMutation({
    mutationFn: (values: z.infer<typeof editChatSchema>) =>
      editChat({ data: { chatId: props.chat.id, name: values.name } }),
    onSuccess: () => {
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', { chatId: props.chat.id }] });
      toast.success('Chat updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update chat');
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Pencil size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chat</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => editChatMutation.mutate(values))}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} type='text' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='flex justify-end gap-2'>
              <Button
                type='submit'
                disabled={editChatMutation.isPending || !form.formState.isDirty}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
