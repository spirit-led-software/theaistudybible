import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class DevotionScreen extends HookConsumerWidget {
  final String? devotionId;

  const DevotionScreen({
    super.key,
    this.devotionId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const SizedBox();
  }
}
