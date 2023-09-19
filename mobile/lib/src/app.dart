import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/routes/routes.dart';
import 'package:revelationsai/src/screens/splash_screen.dart';

import 'routes/router_listenable.dart';

class MyApp extends HookConsumerWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routerListenableNotifier =
        ref.watch(routerListenableProvider.notifier);

    final key = useRef(GlobalKey<NavigatorState>(
      debugLabel: 'routerKey',
    ));

    final router = useMemoized(
      () => GoRouter(
        navigatorKey: key.value,
        refreshListenable: routerListenableNotifier,
        debugLogDiagnostics: true,
        initialLocation: "/",
        routes: routes,
        redirect: routerListenableNotifier.redirect,
        errorBuilder: (context, state) {
          return const SplashScreen(redirectPath: "/chat");
        },
      ),
      [routerListenableNotifier],
    );

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'RevelationsAI',
      theme: ThemeData(
        fontFamily: "Catamaran",
        colorScheme: ColorScheme(
          brightness: Brightness.light,
          primary: RAIColors.primary,
          onPrimary: Colors.white,
          secondary: RAIColors.secondary,
          onSecondary: Colors.white,
          error: Colors.red,
          onError: Colors.white,
          background: Colors.white,
          onBackground: RAIColors.primary,
          surface: Colors.white,
          onSurface: RAIColors.primary,
        ),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
