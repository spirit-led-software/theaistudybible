import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/user/request.dart';
import 'package:revelationsai/src/providers/user/current.dart';

class RenameDialog extends HookConsumerWidget {
  const RenameDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final textEditingController = useTextEditingController(
      text: currentUser.requireValue.name,
    );

    return AlertDialog(
      title: const Text("Edit Name"),
      content: TextField(
        controller: textEditingController,
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text("Cancel"),
        ),
        TextButton(
          onPressed: () {
            ref.read(currentUserProvider.notifier).updateUser(
                  UpdateUserRequest(
                    name: textEditingController.text,
                  ),
                );
            Navigator.pop(context);
          },
          child: const Text("Save"),
        ),
      ],
    );
  }
}
