import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:revelationsai/main.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class SplashScreen extends HookWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    useEffect(
      () {
        messaging.requestPermission(
          alert: true,
          announcement: false,
          badge: true,
          carPlay: false,
          criticalAlert: false,
          provisional: false,
          sound: true,
        );
        return () {};
      },
      [],
    );

    return Scaffold(
      backgroundColor: RAIColors.primary,
      body: const Center(
        child: Logo(
          fontSize: 32,
          colorScheme: RAIColorScheme.light,
        ),
      ),
    );
  }
}
