import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:uuid/uuid.dart';

class CreateDialog extends HookConsumerWidget {
  const CreateDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatManager = ref.watch(chatManagerProvider).requireValue;

    final formKey = useRef(GlobalKey<FormState>());
    final controller = useTextEditingController();

    final createFuture = useState<Future?>(null);
    final createSnapshot = useFuture(createFuture.value);

    return AlertDialog(
      title: const Text('New Chat'),
      content: Form(
        key: formKey.value,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Name (Optional)',
                hintText: "New Chat",
              ),
              validator: (value) {
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            if (createSnapshot.connectionState == ConnectionState.waiting) return;
            Navigator.of(context).pop();
          },
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            if (!formKey.value.currentState!.validate()) {
              return;
            }
            if (createSnapshot.connectionState == ConnectionState.waiting) {
              return;
            }

            String name = controller.value.text;
            if (name.isEmpty) {
              name = "New Chat";
            }

            createFuture.value = chatManager
                .createChat(
              CreateChatRequest(
                id: const Uuid().v4(),
                name: name,
              ),
            )
                .then(
              (chat) {
                Navigator.of(context).pop();
                context.go('/chat/${chat.id}');
              },
            );
            await createFuture.value;
          },
          child: createSnapshot.hasError && createSnapshot.connectionState != ConnectionState.waiting
              ? Icon(
                  Icons.close,
                  color: context.colorScheme.error,
                )
              : createSnapshot.connectionState == ConnectionState.waiting
                  ? CircularProgressIndicator.adaptive(
                      backgroundColor: context.colorScheme.onPrimary,
                    )
                  : const Text("Create"),
        ),
      ],
    );
  }
}
