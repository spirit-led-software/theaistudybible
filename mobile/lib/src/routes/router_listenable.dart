import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:go_router/go_router.dart';
import 'package:revelationsai/src/providers/advertisements/interstitial_ad.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/providers/repo_initialization.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'router_listenable.g.dart';

@riverpod
class RouterListenable extends _$RouterListenable implements Listenable {
  VoidCallback? _routerListener;
  late bool _isAuth = false; // Useful for our global redirect function

  @override
  Future<void> build() async {
    await Future.wait([
      ref.watch(currentUserProvider.future).then((value) async {
        await ref.watch(repositoryInitializationProvider.future);
        _isAuth = true;
        return;
      }).catchError((_) {
        _isAuth = false;
        return;
      }),
      ref.watch(currentUserPreferencesProvider.future),
    ]);

    await ref.read(interstitialAdsProvider.future);

    ref.listenSelf((_, __) {
      // One could write more conditional logic for when to call redirection
      if (state.isLoading) return;
      _routerListener?.call();
    });
  }

  /// Redirects the user when our authentication changes
  String? redirect(BuildContext context, GoRouterState state) {
    final isSplash = state.uri.path == "/";

    if (this.state.hasError) {
      debugPrint("Router has error: ${this.state.error}");
      return null;
    }

    if (this.state.isLoading) {
      debugPrint("Router is loading");
      return isSplash ? null : "/?redirect=${Uri.encodeComponent(state.uri.path)}";
    }

    debugPrint("Router initialized, removing splash screen...");
    FlutterNativeSplash.remove();
    debugPrint("Router path: ${state.uri.path}");

    final isChatBase = state.uri.path == "/chat";
    final isDevotionBase = state.uri.path == "/devotions";

    final currentChatId = ref.read(currentChatIdProvider);
    final chatPath = "/chat/${currentChatId ?? ""}";

    if (isSplash) {
			final redirect = state.uri.queryParameters["redirect"] ?? chatPath;
      debugPrint("Redirecting to $redirect");
      return _isAuth ? redirect : "/auth/login";
    }

    final isForgotPassword = state.uri.path.startsWith("/auth/forgot-password");
    if (isForgotPassword) return null;

    final isLoggingIn = state.uri.path.startsWith("/auth");
    if (isLoggingIn) return _isAuth ? chatPath : null;

    if (isChatBase && currentChatId != null) {
      debugPrint("Redirecting to $chatPath");
      return chatPath;
    }

    final currentDevotionId = ref.read(currentDevotionIdProvider);
    if (isDevotionBase && currentDevotionId != null) {
      final devoPath = "/devotions/$currentDevotionId";
      debugPrint("Redirecting to $devoPath");
      return devoPath;
    }

    return _isAuth ? null : "/";
  }

  /// Adds [GoRouter]'s listener as specified by its [Listenable].
  /// [GoRouteInformationProvider] uses this method on creation to handle its
  /// internal [ChangeNotifier].
  /// Check out the internal implementation of [GoRouter] and
  /// [GoRouteInformationProvider] to see this in action.
  @override
  void addListener(VoidCallback listener) {
    _routerListener = listener;
  }

  /// Removes [GoRouter]'s listener as specified by its [Listenable].
  /// [GoRouteInformationProvider] uses this method when disposing,
  /// so that it removes its callback when destroyed.
  /// Check out the internal implementation of [GoRouter] and
  /// [GoRouteInformationProvider] to see this in action.
  @override
  void removeListener(VoidCallback listener) {
    _routerListener = null;
  }
}
