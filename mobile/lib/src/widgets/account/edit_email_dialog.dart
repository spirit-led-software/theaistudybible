import 'package:email_validator/email_validator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/user/request.dart';
import 'package:revelationsai/src/providers/user/current.dart';

class EditEmailDialog extends HookConsumerWidget {
  const EditEmailDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final textEditingController = useTextEditingController(
      text: currentUser.requireValue.email,
    );
    final formKey = useRef(GlobalKey<FormState>());

    return AlertDialog(
      title: const Text("Edit Email"),
      content: Form(
        key: formKey.value,
        child: TextFormField(
          controller: textEditingController,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Email cannot be empty.';
            }
            if (!EmailValidator.validate(value)) {
              return 'Please enter a valid email.';
            }
            return null;
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text("Cancel"),
        ),
        TextButton(
          onPressed: () async {
            if (formKey.value.currentState?.validate() == false) return;

            ref.read(currentUserProvider.notifier).updateUser(
                  UpdateUserRequest(
                    email: textEditingController.text,
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
