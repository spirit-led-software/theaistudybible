import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:screenshot/screenshot.dart';

/// Creates [ScreenshotController] that will be disposed automatically.
///
/// See also:
/// - [ScreenshotController]
ScreenshotController useScreenshotController({
  List<Object?>? keys,
}) {
  return use(
    _ScreenshotControllerHook(
      keys: keys,
    ),
  );
}

class _ScreenshotControllerHook extends Hook<ScreenshotController> {
  const _ScreenshotControllerHook({
    super.keys,
  });

  @override
  HookState<ScreenshotController, Hook<ScreenshotController>> createState() => _ScreenshotControllerHookState();
}

class _ScreenshotControllerHookState extends HookState<ScreenshotController, _ScreenshotControllerHook> {
  late final controller = ScreenshotController();

  @override
  ScreenshotController build(BuildContext context) => controller;

  @override
  void dispose() => super.dispose();

  @override
  String get debugLabel => 'useScreenshotController';
}
