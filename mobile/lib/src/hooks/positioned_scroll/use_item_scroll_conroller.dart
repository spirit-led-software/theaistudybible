import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

/// Creates [ItemScrollController] that will be disposed automatically.
///
/// See also:
/// - [ItemScrollController]
ItemScrollController useItemScrollController({
  List<Object?>? keys,
}) {
  return use(
    _ItemScrollControllerHook(
      keys: keys,
    ),
  );
}

class _ItemScrollControllerHook extends Hook<ItemScrollController> {
  const _ItemScrollControllerHook({
    List<Object?>? keys,
  }) : super(keys: keys);

  @override
  HookState<ItemScrollController, Hook<ItemScrollController>> createState() => _ItemScrollControllerHookState();
}

class _ItemScrollControllerHookState extends HookState<ItemScrollController, _ItemScrollControllerHook> {
  late final controller = ItemScrollController();

  @override
  ItemScrollController build(BuildContext context) => controller;

  @override
  void dispose() => super.dispose();

  @override
  String get debugLabel => 'useItemScrollController';
}
