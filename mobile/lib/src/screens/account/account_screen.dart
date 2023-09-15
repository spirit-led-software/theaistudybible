import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/screens/account/settings_modal.dart';
import 'package:url_launcher/url_launcher.dart';

class AccountScreen extends HookConsumerWidget {
  const AccountScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          "Account",
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: RAIColors.primary,
        actions: [
          IconButton(
            onPressed: () {
              showModalBottomSheet(
                elevation: 20,
                isScrollControlled: true,
                context: context,
                backgroundColor: Colors.white,
                builder: (_) => const FractionallySizedBox(
                  heightFactor: 0.90,
                  widthFactor: 1,
                  child: SettingsModal(),
                ),
              );
            },
            icon: const FaIcon(
              FontAwesomeIcons.gear,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          Positioned(
            top: 10,
            left: 50,
            right: 50,
            child: Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: RAIColors.secondary,
                borderRadius: BorderRadius.circular(25),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(
                    Icons.info,
                    color: Colors.white,
                  ),
                  SizedBox(
                    height: 10,
                  ),
                  Flexible(
                    child: Text(
                      "Account Editing Coming Soon!",
                      softWrap: true,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 20,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Colors.grey.shade400,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(100),
                    child: Center(
                      child: currentUser.requireValue.image != null
                          ? Image.network(
                              currentUser.requireValue.image!,
                              scale: 0.5,
                              filterQuality: FilterQuality.high,
                            )
                          : Text(
                              currentUser.requireValue.name
                                      ?.substring(0, 1)
                                      .toUpperCase() ??
                                  currentUser.requireValue.email
                                      .substring(0, 1)
                                      .toUpperCase(),
                              style: const TextStyle(
                                fontSize: 40,
                              ),
                            ),
                    ),
                  ),
                ),
                const SizedBox(
                  height: 10,
                ),
                Text(
                  currentUser.requireValue.name ??
                      currentUser.requireValue.email,
                  style: const TextStyle(
                    fontSize: 20,
                  ),
                ),
                const SizedBox(
                  height: 30,
                ),
                TextButton(
                  style: TextButton.styleFrom(
                    backgroundColor: RAIColors.secondary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: 15,
                      horizontal: 50,
                    ),
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.all(
                        Radius.circular(10),
                      ),
                    ),
                  ),
                  onPressed: () async {
                    await launchUrl(
                      Uri.parse("https://revelationsai.com/upgrade"),
                      mode: LaunchMode.externalApplication,
                      webViewConfiguration: WebViewConfiguration(
                        headers: {
                          'rai-session': currentUser.requireValue.session,
                        },
                      ),
                    );
                  },
                  child: const Text("Upgrade"),
                ),
                const SizedBox(
                  height: 10,
                ),
                TextButton(
                  style: ButtonStyle(
                    backgroundColor:
                        MaterialStateProperty.all(RAIColors.primary),
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
                  child: const Text("Logout"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
