import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'devotion.g.dart';

@riverpod
class Devotions extends _$Devotions {
  @override
  FutureOr<Devotion> build(String id) {
    return DevotionService.getDevotion(
      id: id,
    );
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
