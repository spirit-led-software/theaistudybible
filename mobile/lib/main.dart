import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/app.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/utils/state_logger.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:workmanager/workmanager.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse notificationResponse) {
  debugPrint('notification(${notificationResponse.id}) action tapped: '
      '${notificationResponse.actionId} with'
      ' payload: ${notificationResponse.payload}');
  if (notificationResponse.input?.isNotEmpty ?? false) {
    debugPrint(
        'notification action tapped with input: ${notificationResponse.input}');
  }
}

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    debugPrint("Native called background task: $task");
    if (task == "daily-devo") {
      PaginatedEntitiesResponseData<Devotion> devos =
          await DevotionService.getDevotions(
        paginationOptions: const PaginatedEntitiesRequestOptions(limit: 1),
      );

      Devotion devo = devos.entities.first;
      debugPrint("Daily devo: ${devo.date}");

      await flutterLocalNotificationsPlugin.show(
        Random().nextInt(1000),
        "New Devotion Available",
        devo.bibleReading,
        const NotificationDetails(
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
          android: AndroidNotificationDetails(
            "daily-devo",
            "Daily Devotion",
            importance: Importance.max,
            priority: Priority.high,
            showWhen: false,
            enableVibration: true,
            enableLights: true,
            playSound: true,
            visibility: NotificationVisibility.public,
            timeoutAfter: 5000,
          ),
        ),
      );

      await Workmanager().registerOneOffTask(
        "daily-devo",
        "Daily Devotion",
        initialDelay: const Duration(days: 1),
      );
    }

    return Future.value(true);
  });
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: ".env");
  await _configureLocalTimeZone();
  await Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: true,
  );

  final NotificationAppLaunchDetails? notificationAppLaunchDetails =
      await flutterLocalNotificationsPlugin.getNotificationAppLaunchDetails();
  if (notificationAppLaunchDetails?.didNotificationLaunchApp ?? false) {
    debugPrint('Notification launched app');
    debugPrint(
        'notificationAppLaunchDetails.payload: ${notificationAppLaunchDetails?.notificationResponse}');
  }

  const InitializationSettings initializationSettings = InitializationSettings(
    android: AndroidInitializationSettings("ic_launcher"),
    iOS: DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
      defaultPresentAlert: true,
      defaultPresentBadge: true,
      defaultPresentSound: true,
    ),
  );
  await flutterLocalNotificationsPlugin.initialize(
    initializationSettings,
    onDidReceiveNotificationResponse:
        (NotificationResponse notificationResponse) {
      debugPrint('notification(${notificationResponse.id}) action tapped: '
          '${notificationResponse.actionId} with'
          ' payload: ${notificationResponse.payload}');
    },
    onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
  );

  Workmanager().registerOneOffTask(
    "daily-devo",
    "Daily Devotion",
    initialDelay: const Duration(seconds: 10),
    constraints: Constraints(
      networkType: NetworkType.connected,
      requiresBatteryNotLow: true,
    ),
  );

  runApp(
    const ProviderScope(
      observers: [StateLogger()],
      child: MyApp(),
    ),
  );
}

Future<void> _configureLocalTimeZone() async {
  tz.initializeTimeZones();
  final String timeZoneName = await FlutterTimezone.getLocalTimezone();
  tz.setLocalLocation(tz.getLocation(timeZoneName));
}
