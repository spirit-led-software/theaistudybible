import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class SplashScreen extends HookWidget {
  final String? redirectPath;

  const SplashScreen({Key? key, this.redirectPath}) : super(key: key);

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
      backgroundColor: RAIColors.primary,
      body: const Center(
        child: Logo(
          fontSize: 32,
          colorScheme: RAIColorScheme.light,
        ),
      ),
    );
  }
}
