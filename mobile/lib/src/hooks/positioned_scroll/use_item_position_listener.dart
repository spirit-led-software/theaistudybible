import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

/// Creates [ItemPositionsListener] that will be disposed automatically.
///
/// See also:
/// - [ItemPositionsListener]
ItemPositionsListener useItemPositionsListener({
  List<Object?>? keys,
}) {
  return use(
    _ItemPositionsListenerHook(
      keys: keys,
    ),
  );
}

class _ItemPositionsListenerHook extends Hook<ItemPositionsListener> {
  const _ItemPositionsListenerHook({super.keys});

  @override
  HookState<ItemPositionsListener, Hook<ItemPositionsListener>> createState() => _ItemPositionsListenerHookState();
}

class _ItemPositionsListenerHookState extends HookState<ItemPositionsListener, _ItemPositionsListenerHook> {
  late final controller = ItemPositionsListener.create();

  @override
  ItemPositionsListener build(BuildContext context) => controller;

  @override
  void dispose() => super.dispose();

  @override
  String get debugLabel => 'useItemPositionsListener';
}
