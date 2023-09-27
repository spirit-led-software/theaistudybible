import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/services/user.dart';

class SettingsModal extends HookConsumerWidget {
  const SettingsModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(
              top: 10,
              bottom: 10,
              left: 30,
            ),
            decoration: ShapeDecoration(
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              color: RAIColors.primary,
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Settings',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(
                    Icons.close,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          ListBody(
            mainAxis: Axis.vertical,
            children: [
              ListTile(
                shape: BeveledRectangleBorder(
                  side: BorderSide(
                    color: RAIColors.primary,
                    width: 0.5,
                    style: BorderStyle.solid,
                  ),
                ),
                leading: const Icon(Icons.info_outlined),
                title: const Text('About RevelationsAI'),
                onTap: () {
                  context.go("/about");
                },
              ),
              SwitchListTile.adaptive(
                shape: BeveledRectangleBorder(
                  side: BorderSide(
                    color: RAIColors.primary,
                    width: 0.5,
                    style: BorderStyle.solid,
                  ),
                ),
                title: const Row(
                  children: [
                    Icon(Icons.vibration_outlined),
                    SizedBox(width: 10),
                    Text('Haptic Feedback'),
                  ],
                ),
                value: ref
                    .watch(currentUserPreferencesProvider)
                    .requireValue
                    .hapticFeedback,
                onChanged: (value) {
                  ref
                      .read(currentUserPreferencesProvider.notifier)
                      .setHapticFeedback(value);
                },
              ),
              ListTile(
                shape: BeveledRectangleBorder(
                  side: BorderSide(
                    color: RAIColors.primary,
                    width: 0.5,
                    style: BorderStyle.solid,
                  ),
                ),
                leading: const Icon(Icons.logout),
                title: const Text('Logout'),
                onTap: () async {
                  await ref
                      .read(currentUserProvider.notifier)
                      .logout()
                      .then((value) => context.go("/auth/login"));
                },
              ),
              ListTile(
                shape: const BeveledRectangleBorder(
                  side: BorderSide(
                    color: Colors.white,
                    width: 0.5,
                    style: BorderStyle.solid,
                  ),
                ),
                textColor: Colors.red.shade400,
                leading: Icon(
                  Icons.delete_forever_outlined,
                  color: Colors.red.shade400,
                ),
                title: const Text('Delete Account'),
                onTap: () async {
                  // display confirmation dialog
                  await showDialog(
                    context: context,
                    builder: (context) {
                      return AlertDialog(
                        title: const Text('Delete Account'),
                        content: const Text(
                          'Are you sure you want to delete your account and all of its data? This action cannot be undone.',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                            },
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop(true);
                            },
                            child: const Text('Delete'),
                          ),
                        ],
                      );
                    },
                  ).then((value) async {
                    if (value == true) {
                      await UserService.deleteUser(
                        id: ref.read(currentUserProvider).requireValue.id,
                        session:
                            ref.read(currentUserProvider).requireValue.session,
                      );
                      await ref
                          .read(currentUserProvider.notifier)
                          .logout()
                          .then((value) => context.go("/auth/login"));
                    }
                  });
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
