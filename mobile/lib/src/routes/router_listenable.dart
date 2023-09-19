import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:go_router/go_router.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'router_listenable.g.dart';

@riverpod
class RouterListenable extends _$RouterListenable implements Listenable {
  VoidCallback? _routerListener;
  bool _isAuth = false; // Useful for our global redirect function

  @override
  Future<void> build() async {
    // One could watch more providers and write logic accordingly
    final currentUserFuture = ref.watch(currentUserProvider.future);
    await currentUserFuture.then((value) {
      _isAuth = true;
      return;
    }).catchError((_) {
      _isAuth = false;
      return;
    });
    await ref.watch(currentUserPreferencesProvider.future);

    ref.listenSelf((_, __) {
      // One could write more conditional logic for when to call redirection
      if (state.isLoading) return;
      _routerListener?.call();
    });
  }

  /// Redirects the user when our authentication changes
  String? redirect(BuildContext context, GoRouterState state) {
    if (this.state.isLoading) {
      debugPrint("Router is loading");
      return null;
    }

    if (this.state.hasError) {
      debugPrint("Router has error: ${this.state.error}");
      return null;
    }

    debugPrint("Router initialize, removing splash screen...");
    FlutterNativeSplash.remove();
    debugPrint("Router path: ${state.uri.path}");

    final isSplash = state.uri.path == "/";

    if (isSplash) {
      debugPrint("Redirecting to ${_isAuth ? "/chat" : "/auth/login"}");
      return _isAuth ? "/chat" : "/auth/login";
    }

    final isLoggingIn = state.uri.path.startsWith("/auth");
    if (isLoggingIn) return _isAuth ? "/chat" : null;

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
