import 'package:flutter/material.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/settings/settings_controller.dart';

class AccountView extends StatefulWidget {
  const AccountView({super.key, required this.settingsController});

  final SettingsController settingsController;

  @override
  State<AccountView> createState() => _AccountViewState();
}

class _AccountViewState extends State<AccountView> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: RaiColors.primary,
        title: const Text('Account'),
      ),
      body: const Center(
        child: Text('Account'),
      ),
    );
  }
}
