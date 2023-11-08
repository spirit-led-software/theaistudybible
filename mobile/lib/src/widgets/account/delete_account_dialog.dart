import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/user.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class DeleteAccountDialog extends HookConsumerWidget {
  const DeleteAccountDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUserNotifier = ref.watch(currentUserProvider.notifier);
    final currentUser = ref.watch(currentUserProvider).requireValue;

    final future = useState<Future?>(null);
    final snapshot = useFuture(future.value);

    return AlertDialog(
      title: const Text('Delete Account'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (snapshot.hasError) ...[
            Text(
              snapshot.error.toString(),
              style: TextStyle(
                color: context.colorScheme.error,
              ),
            ),
            const SizedBox(height: 10),
          ],
          const Text(
            'Are you sure you want to delete your account and all of its data? This action cannot be undone.',
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () {
            if (snapshot.connectionState == ConnectionState.waiting) return;
            Navigator.of(context).pop();
          },
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () async {
            if (snapshot.connectionState == ConnectionState.waiting) return;
            future.value = UserService.deleteUser(
              id: currentUser.id,
              session: currentUser.session,
            ).then((value) async {
              await currentUserNotifier.logout();
            }).then((value) {
              context.go("/auth/login");
            });
            await future.value;
          },
          child: snapshot.hasError && snapshot.connectionState != ConnectionState.waiting
              ? Icon(
                  Icons.close,
                  color: context.colorScheme.error,
                )
              : snapshot.connectionState == ConnectionState.waiting
                  ? CircularProgressIndicator.adaptive(
                      backgroundColor: context.colorScheme.onPrimary,
                    )
                  : const Text('Delete'),
        ),
      ],
    );
  }
}
