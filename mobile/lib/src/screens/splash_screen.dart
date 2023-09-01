import 'package:flutter/material.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
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
