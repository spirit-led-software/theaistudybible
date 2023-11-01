import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app_badger/flutter_app_badger.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:newrelic_mobile/config.dart';
import 'package:newrelic_mobile/newrelic_mobile.dart';
import 'package:revelationsai/firebase_options.dart';
import 'package:revelationsai/src/app.dart';
import 'package:revelationsai/src/constants/new_relic.dart';
import 'package:revelationsai/src/utils/state_logger.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();

  debugPrint('Handling a background message ${message.messageId}');
  await FlutterAppBadger.isAppBadgeSupported().then((value) {
    if (value) {
      FlutterAppBadger.updateBadgeCount(1);
    }
  });
}

Future<void> main() async {
  final binding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: binding);

  debugPrint('Initializing Firebase');
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  ).then((_) {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    FirebaseMessaging.instance.subscribeToTopic('daily-devo');
  });

  await MobileAds.instance.initialize();

  debugPrint("Removing all previous notification badges");
  await FlutterAppBadger.isAppBadgeSupported().then((value) {
    if (value) {
      FlutterAppBadger.updateBadgeCount(0);
    }
  });

  if (!kDebugMode) {
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
      debugPrint('Running flutter app with New Relic');
      runApp(
        const ProviderScope(
          observers: [StateLogger()],
          child: RAIApp(),
        ),
      );
    });
  } else {
    debugPrint('Running flutter app in debug mode');
    runApp(
      const ProviderScope(
        observers: [StateLogger()],
        child: RAIApp(),
      ),
    );
  }
}
