import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:uuid/uuid.dart';

class CreateDialog extends HookConsumerWidget {
  const CreateDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatsNotifier = ref.watch(chatsPagesProvider.notifier);
    final TextEditingController controller = TextEditingController();

    return AlertDialog(
      title: const Text('New Chat'),
      content: TextField(
        controller: controller,
        decoration: const InputDecoration(
          labelText: 'Name',
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (controller.value.text.isEmpty) {
              return;
            }
            chatsNotifier.createChat(
              CreateChatRequest(
                id: const Uuid().v4(),
                name: controller.value.text,
              ),
            );
            Navigator.of(context).pop();
          },
          child: const Text('Create'),
        ),
      ],
    );
  }
}
