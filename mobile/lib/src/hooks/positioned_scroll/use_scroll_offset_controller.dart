import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

/// Creates [ScrollOffsetController] that will be disposed automatically.
///
/// See also:
/// - [ScrollOffsetController]
ScrollOffsetController useScrollOffsetController({
  List<Object?>? keys,
}) {
  return use(
    _ScrollOffsetControllerHook(
      keys: keys,
    ),
  );
}

class _ScrollOffsetControllerHook extends Hook<ScrollOffsetController> {
  const _ScrollOffsetControllerHook({
    List<Object?>? keys,
  }) : super(keys: keys);

  @override
  HookState<ScrollOffsetController, Hook<ScrollOffsetController>> createState() => _ScrollOffsetControllerHookState();
}

class _ScrollOffsetControllerHookState extends HookState<ScrollOffsetController, _ScrollOffsetControllerHook> {
  late final controller = ScrollOffsetController();

  @override
  ScrollOffsetController build(BuildContext context) => controller;

  @override
  void dispose() => super.dispose();

  @override
  String get debugLabel => 'useScrollOffsetController';
}
