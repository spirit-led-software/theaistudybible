import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:newrelic_mobile/newrelic_navigation_observer.dart';
import 'package:revelationsai/src/constants/theme.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/routes/routes.dart';
import 'package:revelationsai/src/screens/splash_screen.dart';

import 'routes/router_listenable.dart';

class RAIApp extends HookConsumerWidget {
  final String initLocation;

  const RAIApp({
    super.key,
    String? initialLocation,
  }) : initLocation = initialLocation ?? '/';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    debugPrint("Building app...");

    final routerListenableNotifier = ref.watch(routerListenableProvider.notifier);

    final key = useRef(GlobalKey<NavigatorState>(
      debugLabel: 'routerKey',
    ));

    final router = useMemoized(
      () => GoRouter(
        observers: [NewRelicNavigationObserver()],
        navigatorKey: key.value,
        refreshListenable: routerListenableNotifier,
        debugLogDiagnostics: true,
        initialLocation: initLocation,
        routes: routes,
        redirect: routerListenableNotifier.redirect,
        errorBuilder: (context, state) {
          return const SplashScreen(redirectPath: "/chat");
        },
      ),
      [routerListenableNotifier],
    );

    useEffect(() {
      FirebaseMessaging.onMessage.listen((message) {
        switch (message.data['type']) {
          case 'daily-devo':
            context.go('/devotions/${message.data['id'] ?? ''}');
            break;
          default:
            break;
        }
      });
      return () {};
    }, [FirebaseMessaging.onMessage]);

    return _EagerlyInitializedProviders(
      child: MaterialApp.router(
        debugShowCheckedModeBanner: false,
        title: 'RevelationsAI',
        theme: RAITheme.light,
        darkTheme: RAITheme.dark,
        themeMode: ref.watch(currentUserPreferencesProvider).value?.themeMode ?? ThemeMode.system,
        routerConfig: router,
      ),
    );
  }
}

class _EagerlyInitializedProviders extends ConsumerWidget {
  final Widget child;

  const _EagerlyInitializedProviders({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(currentChatIdProvider);
    ref.watch(currentDevotionIdProvider);

    return child;
  }
}
