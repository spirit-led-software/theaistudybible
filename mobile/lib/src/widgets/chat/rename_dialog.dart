import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat.dart';

class RenameDialog extends HookConsumerWidget {
  final String id;
  final String name;

  const RenameDialog({
    Key? key,
    required this.id,
    required this.name,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatsNotifier = ref.read(chatsProvider(id).notifier);
    final TextEditingController controller = TextEditingController(text: name);

    return AlertDialog(
      title: const Text('Rename Chat'),
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
            chatsNotifier.updateChat(
              UpdateChatRequest(
                name: controller.value.text,
              ),
            );
            Navigator.of(context).pop();
          },
          child: const Text('Update'),
        ),
      ],
    );
  }
}
