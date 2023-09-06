import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/screens/account/account_screen.dart';
import 'package:revelationsai/src/screens/auth/login_screen.dart';
import 'package:revelationsai/src/screens/auth/register_screen.dart';
import 'package:revelationsai/src/screens/chat/chat_screen.dart';
import 'package:revelationsai/src/screens/devotion/devotion_screen.dart';
import 'package:revelationsai/src/screens/splash_screen.dart';
import 'package:revelationsai/src/widgets/tabs_scaffold.dart';

List<RouteBase> routes = [
  GoRoute(
    path: "/",
    builder: (context, state) {
      return const SplashScreen();
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
    path: "/auth/login",
    builder: (context, state) {
      return const LoginScreen();
    },
  ),
  GoRoute(
    path: "/auth/register",
    builder: (context, state) {
      return const RegisterScreen();
    },
  ),
  ShellRoute(
    navigatorKey: GlobalKey<NavigatorState>(),
    builder: (context, state, child) {
      return TabsScaffold(child: child);
    },
    routes: [
      GoRoute(
        path: "/chat",
        builder: (context, state) {
          return const ChatScreen();
        },
        routes: [
          GoRoute(
            path: ":id",
            builder: (context, state) {
              return ChatScreen(
                chatId: state.pathParameters['id'],
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
        routes: [
          GoRoute(
            path: ":id",
            builder: (context, state) {
              return DevotionScreen(
                devotionId: state.pathParameters['id'],
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
      )
    ],
  )
];
