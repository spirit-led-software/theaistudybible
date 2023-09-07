import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/providers/user.dart';

class AccountScreen extends HookConsumerWidget {
  const AccountScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return SafeArea(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: RAIColors.secondary,
              foregroundImage: currentUser.requireValue.image != null
                  ? NetworkImage(
                      currentUser.requireValue.image!,
                    )
                  : null,
              child: Text(
                currentUser.requireValue.name?.substring(0, 1).toUpperCase() ??
                    currentUser.requireValue.email
                        .substring(0, 1)
                        .toUpperCase(),
                style: const TextStyle(
                  fontSize: 40,
                ),
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Text(
              currentUser.requireValue.name ?? currentUser.requireValue.email,
              style: const TextStyle(
                fontSize: 20,
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            TextButton(
                style: ButtonStyle(
                  backgroundColor: MaterialStateProperty.all(RAIColors.primary),
                  foregroundColor: MaterialStateProperty.all(Colors.white),
                  padding: MaterialStateProperty.all(
                    const EdgeInsets.symmetric(
                      vertical: 10,
                      horizontal: 50,
                    ),
                  ),
                  shape: MaterialStateProperty.all(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                onPressed: () async {
                  await ref
                      .read(currentUserProvider.notifier)
                      .logout()
                      .then((value) => context.go("/auth/login"));
                },
                child: const Text("Logout"))
          ],
        ),
      ),
    );
  }
}
