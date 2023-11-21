import 'dart:io';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/constants/website.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/models/user/request.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/account/delete_account_dialog.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:url_launcher/url_launcher_string.dart';

class SettingsModal extends HookConsumerWidget {
  const SettingsModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        color: context.theme.canvasColor,
        borderRadius: const BorderRadius.only(
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
                leading: const Icon(Icons.info_outlined),
                title: const Text('About RevelationsAI'),
                onTap: () {
                  context.go("/about");
                },
              ),
              ListTile(
                leading: const Icon(Icons.privacy_tip_outlined),
                title: const Text('Privacy Policy'),
                onTap: () async {
                  await launchUrlString(
                    '${Website.url}/privacy-policy',
                    mode: LaunchMode.inAppWebView,
                    webViewConfiguration: const WebViewConfiguration(
                      enableJavaScript: true,
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.article_outlined),
                title: const Text('Terms of Use'),
                onTap: () async {
                  await launchUrlString(
                    Platform.isIOS
                        ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
                        : 'https://play.google.com/about/play-terms/',
                    mode: LaunchMode.inAppWebView,
                    webViewConfiguration: const WebViewConfiguration(
                      enableJavaScript: true,
                    ),
                  );
                },
              ),
              ListTile(
                leading: const FaIcon(FontAwesomeIcons.headset),
                title: const Text('Support'),
                onTap: () async {
                  await launchUrl(
                    Uri.parse(
                        'mailto:support@revelationsai.com?subject=${Uri.encodeComponent('RevelationsAI Support Request')}'),
                    mode: LaunchMode.externalApplication,
                  );
                },
              ),
              ListTile(
                leading:
                    context.isLightMode ? const Icon(Icons.light_mode_outlined) : const Icon(Icons.dark_mode_outlined),
                title: const Text('Theme Mode'),
                trailing: DropdownButton(
                  value: ref.watch(currentUserPreferencesProvider).requireValue.themeMode,
                  onChanged: (value) {
                    ref.read(currentUserPreferencesProvider.notifier).updatePrefs(
                          ref.read(currentUserPreferencesProvider).requireValue.copyWith(themeMode: value as ThemeMode),
                        );
                  },
                  items: const <DropdownMenuItem>[
                    DropdownMenuItem(
                      value: ThemeMode.system,
                      child: Text('System'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.light,
                      child: Text('Light'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.dark,
                      child: Text('Dark'),
                    ),
                  ],
                ),
              ),
              ListTile(
                leading: const FaIcon(FontAwesomeIcons.language),
                title: const Text('Preferred Translation'),
                trailing: DropdownButton(
                  value: ref.watch(currentUserProvider).requireValue.translation,
                  onChanged: (value) async {
                    await ref.read(currentUserProvider.notifier).updateUser(
                          UpdateUserRequest(translation: value as Translation),
                        );
                  },
                  items: Translation.values.map((translation) {
                    return DropdownMenuItem(
                      value: translation,
                      child: Text(translation.toString().split('.').last),
                    );
                  }).toList(),
                ),
              ),
              SwitchListTile.adaptive(
                title: const Row(
                  children: [
                    Icon(CupertinoIcons.waveform),
                    SizedBox(width: 10),
                    Text('Haptic Feedback'),
                  ],
                ),
                value: ref.watch(currentUserPreferencesProvider).requireValue.hapticFeedback,
                onChanged: (value) {
                  ref.read(currentUserPreferencesProvider.notifier).updatePrefs(
                        ref.read(currentUserPreferencesProvider).requireValue.copyWith(hapticFeedback: value),
                      );
                },
              ),
              SwitchListTile.adaptive(
                title: const Row(
                  children: [
                    Icon(CupertinoIcons.chat_bubble_2_fill),
                    SizedBox(width: 10),
                    Text('Chat Suggestions'),
                  ],
                ),
                value: ref.watch(currentUserPreferencesProvider).requireValue.chatSuggestions,
                onChanged: (value) {
                  ref.read(currentUserPreferencesProvider.notifier).updatePrefs(
                        ref.read(currentUserPreferencesProvider).requireValue.copyWith(chatSuggestions: value),
                      );
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('Logout'),
                onTap: () async {
                  await ref.read(currentUserProvider.notifier).logout().then((value) => context.go("/auth/login"));
                },
              ),
              ListTile(
                textColor: Colors.red.shade400,
                leading: Icon(
                  Icons.delete_forever_outlined,
                  color: Colors.red.shade400,
                ),
                title: const Text('Delete Account'),
                onTap: () async {
                  // display confirmation dialog
                  await showDialog(
                    barrierDismissible: false,
                    context: context,
                    builder: (context) {
                      return const DeleteAccountDialog();
                    },
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
