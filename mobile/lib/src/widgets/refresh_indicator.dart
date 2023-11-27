import 'package:flutter/material.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class RAIRefreshIndicator extends StatelessWidget {
  final Widget child;
  final Future<void> Function() onRefresh;

  const RAIRefreshIndicator({super.key, required this.child, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: context.brightness == Brightness.dark ? context.colorScheme.secondary : context.colorScheme.primary,
      backgroundColor:
          context.brightness == Brightness.dark ? context.colorScheme.primary : context.colorScheme.background,
      onRefresh: onRefresh,
      child: child,
    );
  }
}
