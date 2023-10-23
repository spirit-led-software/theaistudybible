import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:uuid/uuid.dart';

class CreateDialog extends HookConsumerWidget {
  const CreateDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextEditingController controller = TextEditingController();

    final isMounted = useIsMounted();
    final loading = useState(false);

    return AlertDialog(
      title: const Text('New Chat'),
      content: TextField(
        controller: controller,
        decoration: const InputDecoration(
          labelText: 'Name (Optional)',
          hintText: "New Chat",
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            if (loading.value) return;
            Navigator.of(context).pop();
          },
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (loading.value) return;

            String name = controller.value.text;
            if (name.isEmpty) {
              name = "New Chat";
            }
            loading.value = true;
            ref
                .watch(chatsPagesProvider.notifier)
                .createChat(CreateChatRequest(
                  id: const Uuid().v4(),
                  name: name,
                ))
                .then((chat) {
              Navigator.of(context).pop();
              context.go('/chat/${chat.id}');
            }).whenComplete(() {
              if (isMounted()) loading.value = false;
            });
          },
          child: loading.value
              ? const CircularProgressIndicator.adaptive()
              : const Text('Create'),
        ),
      ],
    );
  }
}
