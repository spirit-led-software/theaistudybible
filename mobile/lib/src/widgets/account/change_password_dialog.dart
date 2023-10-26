import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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
    final showCurrentPassword = useState(false);

    final newPasswordController = useTextEditingController();
    final newPasswordFocusNode = useFocusNode();
    final showNewPassword = useState(false);

    final newPasswordConfirmationController = useTextEditingController();
    final newPasswordConfirmationFocusNode = useFocusNode();
    final showNewPasswordConfirmation = useState(false);

    final updateFuture = useState<Future?>(null);
    final updateSnapshot = useFuture(updateFuture.value);

    return AlertDialog(
      title: const Text("Change Password"),
      content: Form(
        key: formKey.value,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (updateSnapshot.hasError) ...[
              Text(
                updateSnapshot.error.toString(),
                style: TextStyle(
                  color: context.colorScheme.error,
                ),
              ),
              const SizedBox(height: 10),
            ],
            TextFormField(
              controller: currentPasswordController,
              focusNode: currentPasswordFocusNode,
              obscureText: !showCurrentPassword.value,
              decoration: InputDecoration(
                labelText: "Current Password",
                suffixIcon: IconButton(
                  onPressed: () {
                    showCurrentPassword.value = !showCurrentPassword.value;
                  },
                  icon: FaIcon(
                    showCurrentPassword.value ? FontAwesomeIcons.eye : FontAwesomeIcons.eyeSlash,
                    size: 20,
                  ),
                ),
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
              obscureText: !showNewPassword.value,
              decoration: InputDecoration(
                labelText: "New Password",
                suffixIcon: IconButton(
                  onPressed: () {
                    showNewPassword.value = !showNewPassword.value;
                  },
                  icon: FaIcon(
                    showNewPassword.value ? FontAwesomeIcons.eye : FontAwesomeIcons.eyeSlash,
                    size: 20,
                  ),
                ),
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
              obscureText: !showNewPasswordConfirmation.value,
              decoration: InputDecoration(
                labelText: "Confirm New Password",
                suffixIcon: IconButton(
                  onPressed: () {
                    showNewPasswordConfirmation.value = !showNewPasswordConfirmation.value;
                  },
                  icon: FaIcon(
                    showNewPasswordConfirmation.value ? FontAwesomeIcons.eye : FontAwesomeIcons.eyeSlash,
                    size: 20,
                  ),
                ),
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
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () {
                Navigator.pop(context);
                context.go("/auth/forgot-password");
              },
              child: Text(
                "Forgot Password?",
                style: TextStyle(
                  color: Colors.grey.shade600,
                ),
              ),
            )
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            if (updateSnapshot.connectionState == ConnectionState.waiting) {
              return;
            }
            Navigator.pop(context);
          },
          child: const Text("Cancel"),
        ),
        TextButton(
          onPressed: () async {
            if (!formKey.value.currentState!.validate()) {
              return;
            }
            if (updateSnapshot.connectionState == ConnectionState.waiting) {
              return;
            }

            updateFuture.value = ref
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
            await updateFuture.value;
          },
          child: updateSnapshot.hasError && updateSnapshot.connectionState != ConnectionState.waiting
              ? Icon(
                  Icons.close,
                  color: context.colorScheme.error,
                )
              : updateSnapshot.connectionState == ConnectionState.waiting
                  ? CircularProgressIndicator.adaptive(
                      backgroundColor: context.colorScheme.onPrimary,
                    )
                  : const Text("Change"),
        ),
      ],
    );
  }
}
