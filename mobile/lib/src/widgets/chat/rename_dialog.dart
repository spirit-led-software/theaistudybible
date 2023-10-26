import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

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
    final controller = TextEditingController(text: name);

    final updateFuture = useState<Future?>(null);
    final updateSnapshot = useFuture(updateFuture.value);

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
          onPressed: () async {
            if (controller.value.text.isEmpty) {
              return;
            }
            if (updateSnapshot.connectionState == ConnectionState.waiting) {
              return;
            }

            updateFuture.value = ref
                .read(chatsProvider(id).notifier)
                .updateChat(
                  UpdateChatRequest(
                    name: controller.value.text,
                  ),
                )
                .then((_) {
              Navigator.of(context).pop();
            });

            await updateFuture.value;
          },
          child: updateSnapshot.hasError &&
                  updateSnapshot.connectionState != ConnectionState.waiting
              ? Icon(
                  Icons.close,
                  color: context.colorScheme.error,
                )
              : updateSnapshot.connectionState == ConnectionState.waiting
                  ? CircularProgressIndicator.adaptive(
                      backgroundColor: context.colorScheme.onPrimary,
                    )
                  : const Text("Save"),
        ),
      ],
    );
  }
}
