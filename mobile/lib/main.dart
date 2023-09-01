import 'package:flutter/material.dart';
import 'package:flutter_config/flutter_config.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/app.dart';
import 'package:revelationsai/src/utils/state_logger.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // Required by FlutterConfig
  await FlutterConfig.loadEnvVariables();

  runApp(
    const ProviderScope(
      observers: [StateLogger()],
      child: MyApp(),
    ),
  );
}
