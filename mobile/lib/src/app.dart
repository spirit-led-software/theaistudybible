import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:newrelic_mobile/newrelic_navigation_observer.dart';
import 'package:revelationsai/src/constants/theme.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/routes/routes.dart';
import 'package:revelationsai/src/screens/splash_screen.dart';

import 'routes/router_listenable.dart';

class RAIApp extends HookConsumerWidget {
  const RAIApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routerListenableNotifier =
        ref.watch(routerListenableProvider.notifier);

    ref.watch(chatsPagesProvider);
    ref.watch(devotionsPagesProvider);

    final key = useRef(GlobalKey<NavigatorState>(
      debugLabel: 'routerKey',
    ));

    final router = useMemoized(
      () => GoRouter(
        observers: [NewRelicNavigationObserver()],
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

    final pendingLaunchMessage = useMemoized(
      () => FirebaseMessaging.instance.getInitialMessage(),
      [FirebaseMessaging.instance],
    );
    final launchMessageSnapshot = useFuture(pendingLaunchMessage);

    useMemoized(
      () => FirebaseMessaging.onMessage.listen((message) {
        switch (message.data['type']) {
          case 'daily-devo':
            context.go('/devotions/${message.data['id'] ?? ''}');
            break;
          default:
            break;
        }
      }),
      [FirebaseMessaging.onMessage],
    );

    useEffect(() {
      if (launchMessageSnapshot.hasData && launchMessageSnapshot.data != null) {
        switch (launchMessageSnapshot.data?.data['type']) {
          case 'daily-devo':
            context.go(
                '/devotions/${launchMessageSnapshot.data?.data['id'] ?? ''}');
            break;
          default:
            break;
        }
      }

      return () {};
    }, [launchMessageSnapshot]);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'RevelationsAI',
      theme: RAITheme.light,
      darkTheme: RAITheme.dark,
      themeMode: ref.watch(currentUserPreferencesProvider).value?.themeMode ??
          ThemeMode.system,
      routerConfig: router,
    );
  }
}
