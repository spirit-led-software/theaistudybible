import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/screens/about_screen.dart';
import 'package:revelationsai/src/screens/account/account_screen.dart';
import 'package:revelationsai/src/screens/account/upgrade_screen.dart';
import 'package:revelationsai/src/screens/auth/forgot_password.dart';
import 'package:revelationsai/src/screens/auth/login_screen.dart';
import 'package:revelationsai/src/screens/auth/register_screen.dart';
import 'package:revelationsai/src/screens/chat/chat_screen.dart';
import 'package:revelationsai/src/screens/devotion/devotion_screen.dart';
import 'package:revelationsai/src/screens/splash_screen.dart';
import 'package:revelationsai/src/widgets/tabs_scaffold.dart';

CustomTransitionPage buildPageWithDefaultTransition<T>({
  required BuildContext context,
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        alwaysIncludeSemantics: true,
        opacity: animation,
        child: child,
      );
    },
  );
}

List<RouteBase> routes = [
  GoRoute(
    path: "/",
    builder: (context, state) {
      return const SplashScreen();
    },
  ),
  GoRoute(
    path: "/about",
    builder: (context, state) {
      return const AboutScreen();
    },
    pageBuilder: (context, state) {
      return buildPageWithDefaultTransition(
        context: context,
        state: state,
        child: const AboutScreen(),
      );
    },
  ),
  GoRoute(
    path: "/upgrade",
    builder: (context, state) {
      return const TabsScaffold(child: UpgradeScreen());
    },
    pageBuilder: (context, state) {
      return buildPageWithDefaultTransition(
        context: context,
        state: state,
        child: const TabsScaffold(child: UpgradeScreen()),
      );
    },
  ),
  GoRoute(
    path: "/auth/callback",
    builder: (context, state) {
      if (state.uri.queryParameters.containsKey('token')) {
        final token = state.uri.queryParameters['token'];
        ProviderScope.containerOf(context)
            .read(currentUserProvider.notifier)
            .loginWithToken(token!);
      }
      return const SplashScreen();
    },
  ),
  GoRoute(
    path: "/auth/forgot-password",
    builder: (context, state) {
      return ForgotPasswordScreen(
        token: state.uri.queryParameters['token'],
      );
    },
    pageBuilder: (context, state) {
      return buildPageWithDefaultTransition(
        context: context,
        state: state,
        child: ForgotPasswordScreen(
          token: state.uri.queryParameters['token'],
        ),
      );
    },
  ),
  GoRoute(
    path: "/auth/login",
    builder: (context, state) {
      return LoginScreen(
        resetPassword: state.uri.queryParameters['resetPassword'] == 'true',
      );
    },
    pageBuilder: (context, state) {
      return buildPageWithDefaultTransition(
        context: context,
        state: state,
        child: LoginScreen(
          resetPassword: state.uri.queryParameters['resetPassword'] == 'true',
        ),
      );
    },
  ),
  GoRoute(
    path: "/auth/register",
    builder: (context, state) {
      return const RegisterScreen();
    },
    pageBuilder: (context, state) {
      return buildPageWithDefaultTransition(
        context: context,
        state: state,
        child: const RegisterScreen(),
      );
    },
  ),
  ShellRoute(
    navigatorKey: GlobalKey<NavigatorState>(),
    builder: (context, state, child) {
      return TabsScaffold(child: child);
    },
    pageBuilder: (context, state, child) {
      return buildPageWithDefaultTransition(
        context: context,
        state: state,
        child: TabsScaffold(child: child),
      );
    },
    routes: [
      GoRoute(
        path: "/chat",
        builder: (context, state) {
          return const ChatScreen();
        },
        pageBuilder: (context, state) {
          return buildPageWithDefaultTransition(
            context: context,
            state: state,
            child: const ChatScreen(),
          );
        },
        routes: [
          GoRoute(
            path: ":id",
            builder: (context, state) {
              return ChatScreen(
                chatId: state.pathParameters['id'],
              );
            },
            pageBuilder: (context, state) {
              return buildPageWithDefaultTransition(
                context: context,
                state: state,
                child: ChatScreen(
                  chatId: state.pathParameters['id'],
                ),
              );
            },
          ),
        ],
      ),
      GoRoute(
        path: "/devotions",
        builder: (context, state) {
          return const DevotionScreen();
        },
        pageBuilder: (context, state) {
          return buildPageWithDefaultTransition(
            context: context,
            state: state,
            child: const DevotionScreen(),
          );
        },
        routes: [
          GoRoute(
            path: ":id",
            builder: (context, state) {
              return DevotionScreen(
                devotionId: state.pathParameters['id'],
              );
            },
            pageBuilder: (context, state) {
              return buildPageWithDefaultTransition(
                context: context,
                state: state,
                child: DevotionScreen(
                  devotionId: state.pathParameters['id'],
                ),
              );
            },
          ),
        ],
      ),
      GoRoute(
        path: "/account",
        builder: (context, state) {
          return const AccountScreen();
        },
        pageBuilder: (context, state) {
          return buildPageWithDefaultTransition(
            context: context,
            state: state,
            child: const AccountScreen(),
          );
        },
        routes: const [
          // TODO: More account stuff
        ],
      )
    ],
  )
];
