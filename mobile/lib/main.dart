import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:newrelic_mobile/config.dart';
import 'package:newrelic_mobile/newrelic_mobile.dart';
import 'package:revelationsai/firebase_options.dart';
import 'package:revelationsai/src/app.dart';
import 'package:revelationsai/src/constants/new_relic.dart';
import 'package:revelationsai/src/utils/state_logger.dart';

Future<void> main() async {
  final binding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: binding);

  debugPrint('Initializing Firebase...');
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  ).then((_) {
    FirebaseMessaging.instance.subscribeToTopic('daily-devo');
  });

  String appToken = '';
  if (Platform.isIOS) {
    appToken = RAINewRelic.iosAppToken;
  } else if (Platform.isAndroid) {
    appToken = RAINewRelic.androidAppToken;
  }
  Config config = Config(
    accessToken: appToken,
    analyticsEventEnabled: true,
    networkErrorRequestEnabled: true,
    networkRequestEnabled: true,
    crashReportingEnabled: true,
    interactionTracingEnabled: true,
    httpResponseBodyCaptureEnabled: true,
    loggingEnabled: true,
    webViewInstrumentation: true,
    printStatementAsEventsEnabled: true,
    httpInstrumentationEnabled: true,
  );
  NewrelicMobile.instance.start(config, () {
    debugPrint('Running flutter app...');
    runApp(
      const ProviderScope(
        observers: [StateLogger()],
        child: MyApp(),
      ),
    );
  });
}
