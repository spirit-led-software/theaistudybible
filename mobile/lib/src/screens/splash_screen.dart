import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class SplashScreen extends HookWidget {
  final String? redirectPath;

  const SplashScreen({super.key, this.redirectPath});

  @override
  Widget build(BuildContext context) {
    useEffect(() {
      if (redirectPath != null) {
        Future.delayed(const Duration(seconds: 3), () {
          context.go(redirectPath!);
        });
      }
      return () {};
    }, [redirectPath]);

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
