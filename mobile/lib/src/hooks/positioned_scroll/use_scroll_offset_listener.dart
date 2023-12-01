import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

/// Creates [ScrollOffsetListener] that will be disposed automatically.
///
/// See also:
/// - [ScrollOffsetListener]
ScrollOffsetListener useScrollOffsetListener({
  List<Object?>? keys,
}) {
  return use(
    _ScrollOffsetListenerHook(
      keys: keys,
    ),
  );
}

class _ScrollOffsetListenerHook extends Hook<ScrollOffsetListener> {
  const _ScrollOffsetListenerHook({super.keys});

  @override
  HookState<ScrollOffsetListener, Hook<ScrollOffsetListener>> createState() => _ScrollOffsetListenerHookState();
}

class _ScrollOffsetListenerHookState extends HookState<ScrollOffsetListener, _ScrollOffsetListenerHook> {
  late final controller = ScrollOffsetListener.create();

  @override
  ScrollOffsetListener build(BuildContext context) => controller;

  @override
  void dispose() => super.dispose();

  @override
  String get debugLabel => 'useScrollOffsetListener';
}
