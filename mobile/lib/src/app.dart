import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/routes/routes.dart';
import 'package:revelationsai/src/screens/splash_screen.dart';
import 'package:revelationsai/src/services/purchase.dart';

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

    final inAppPurchases = useRef(InAppPurchase.instance);
    final purchaseStream = useState(inAppPurchases.value.purchaseStream);

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

    useEffect(() {
      purchaseStream.value.listen(
        (event) {
          debugPrint('Purchase stream event: $event');
          for (final element in event) {
            debugPrint('Purchase: $element');
            if (element.status == PurchaseStatus.canceled ||
                element.status == PurchaseStatus.error) {
              debugPrint(
                  'Purchase cancelled/error: ${element.status} ${element.error}');
              inAppPurchases.value.completePurchase(element);
            } else if (element.status == PurchaseStatus.purchased) {
              debugPrint('Purchase successful');
              final currentUser = ref.read(currentUserProvider);
              if (currentUser.hasValue) {
                PurchaseService.verifyPurchase(currentUser.value!, element)
                    .then((value) {
                  if (value) {
                    debugPrint('Purchase verified');
                    inAppPurchases.value.completePurchase(element);
                  } else {
                    debugPrint('Purchase not verified');
                  }
                });
              } else {
                debugPrint('No user to verify purchase');
              }
            }
          }
        },
        onDone: () {
          debugPrint('Purchase stream done');
        },
        onError: (error) {
          debugPrint('Purchase stream error: $error');
        },
        cancelOnError: true,
      );

      return () {};
    }, [purchaseStream.value]);

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
