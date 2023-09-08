import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:revelationsai/main.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class SplashScreen extends HookWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    useEffect(
      () {
        if (Platform.isIOS) {
          flutterLocalNotificationsPlugin
              .resolvePlatformSpecificImplementation<
                  IOSFlutterLocalNotificationsPlugin>()
              ?.requestPermissions(
                alert: true,
                badge: true,
                sound: true,
              );
        } else if (Platform.isAndroid) {
          flutterLocalNotificationsPlugin
              .resolvePlatformSpecificImplementation<
                  AndroidFlutterLocalNotificationsPlugin>()
              ?.areNotificationsEnabled()
              .then((value) {
            if (value == false) {
              flutterLocalNotificationsPlugin
                  .resolvePlatformSpecificImplementation<
                      AndroidFlutterLocalNotificationsPlugin>()
                  ?.requestPermission();
            }
          });
        }
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
