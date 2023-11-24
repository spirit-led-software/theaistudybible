import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class SplashScreen extends HookConsumerWidget {
  final String? redirectPath;

  const SplashScreen({super.key, this.redirectPath});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    useEffect(() {
      if (redirectPath != null && currentUser.hasValue) {
        context.go(redirectPath!);
      }
      return () {};
    }, [currentUser.hasValue, redirectPath]);

    return Scaffold(
      backgroundColor: context.colorScheme.background,
      body: Center(
        child: Logo(
          fontSize: 32,
          colorScheme: context.brightness == Brightness.light ? RAIColorScheme.dark : RAIColorScheme.light,
        ),
      ),
    );
  }
}
