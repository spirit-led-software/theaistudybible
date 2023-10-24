import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/models/user/request.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class ChangePasswordDialog extends HookConsumerWidget {
  const ChangePasswordDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formKey = useRef(GlobalKey<FormState>());

    final currentPasswordController = useTextEditingController();
    final currentPasswordFocusNode = useFocusNode();

    final newPasswordController = useTextEditingController();
    final newPasswordFocusNode = useFocusNode();

    final newPasswordConfirmationController = useTextEditingController();
    final newPasswordConfirmationFocusNode = useFocusNode();

    final loading = useState(false);
    final alert = useState<Alert?>(null);

    return AlertDialog(
      title: const Text("Change Password"),
      content: Form(
        key: formKey.value,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (alert.value != null) ...[
              Text(
                alert.value!.message,
                style: TextStyle(
                  color: alert.value!.type == AlertType.error
                      ? Colors.red
                      : Colors.green,
                ),
              ),
              const SizedBox(height: 10),
            ],
            TextFormField(
              controller: currentPasswordController,
              focusNode: currentPasswordFocusNode,
              decoration: const InputDecoration(
                labelText: "Current Password",
              ),
              onFieldSubmitted: (value) {
                currentPasswordFocusNode.unfocus();
                newPasswordFocusNode.requestFocus();
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Please enter your current password.";
                }

                return null;
              },
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: newPasswordController,
              focusNode: newPasswordFocusNode,
              decoration: const InputDecoration(
                labelText: "New Password",
              ),
              onFieldSubmitted: (value) {
                newPasswordFocusNode.unfocus();
                newPasswordConfirmationFocusNode.requestFocus();
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Please enter a strong new password.";
                }

                if (value.length < 8) {
                  return "Password must be at least 8 characters long.";
                }

                return null;
              },
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: newPasswordConfirmationController,
              focusNode: newPasswordConfirmationFocusNode,
              decoration: const InputDecoration(
                labelText: "Confirm New Password",
              ),
              onFieldSubmitted: (value) {
                newPasswordConfirmationFocusNode.unfocus();
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Please confirm your new password.";
                }

                if (value != newPasswordController.text) {
                  return "Passwords do not match.";
                }

                return null;
              },
            ),
          ],
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
            if (!formKey.value.currentState!.validate()) {
              return;
            }

            try {
              loading.value = true;
              await ref
                  .read(currentUserProvider.notifier)
                  .updateUserPassword(
                    UpdatePasswordRequest(
                      currentPassword: currentPasswordController.text,
                      newPassword: newPasswordController.text,
                    ),
                  )
                  .then((value) {
                Navigator.of(context).pop();
              });
            } catch (e) {
              alert.value = Alert(
                type: AlertType.error,
                message: e.toString(),
              );
            } finally {
              loading.value = false;
            }
          },
          child: loading.value
              ? CircularProgressIndicator.adaptive(
                  backgroundColor: context.colorScheme.onPrimary,
                )
              : const Text("Change"),
        ),
      ],
    );
  }
}
