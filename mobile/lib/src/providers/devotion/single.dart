import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'single.g.dart';

@riverpod
class SingleDevotion extends _$SingleDevotion {
  late String _id;

  @override
  FutureOr<Devotion> build(String? devotionId) async {
    _id = devotionId ?? (await ref.devotions.getLatest()).id;

    return await ref.devotions.get(_id);
  }

  Future<Devotion> refresh() async {
    final devotion = await ref.devotions.refresh(_id);
    state = AsyncData(devotion);
    return devotion;
  }
}
