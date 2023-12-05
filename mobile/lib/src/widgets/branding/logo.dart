import 'package:flutter/material.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class Logo extends StatelessWidget {
  final RAIColorScheme? colorScheme;
  final double width;

  const Logo({
    super.key,
    this.colorScheme,
    this.width = 200,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme =
        this.colorScheme ?? (context.brightness == Brightness.dark ? RAIColorScheme.light : RAIColorScheme.dark);

    return SizedBox(
      width: width,
      child: ClipRRect(
        clipBehavior: Clip.antiAlias,
        child: Image.asset(
          'assets/logo/logo-${colorScheme == RAIColorScheme.dark ? 'dark' : 'light'}.png',
          width: width,
        ),
      ),
    );
  }
}
