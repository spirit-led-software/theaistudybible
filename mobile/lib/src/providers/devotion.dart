import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'devotion.g.dart';

@riverpod
class Devotions extends _$Devotions {
  late DevotionManager _manager;

  @override
  FutureOr<Devotion> build(String id) async {
    _manager = await ref.watch(devotionManagerProvider.future);
    return await _manager.getDevotion(id);
  }

  Future<Devotion> refresh() async {
    final devotion = await _manager.refreshDevotion(id);
    state = AsyncData(devotion);
    return devotion;
  }
}

@Riverpod(keepAlive: true)
Future<DevotionManager> devotionManager(DevotionManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionManager(isar: isar);
}

class DevotionManager {
  final Isar _isar;

  DevotionManager({
    required Isar isar,
  }) : _isar = isar;

  Future<bool> _hasLocalDevotion(String id) async {
    final chat = await _isar.devotions.get(fastHash(id));
    return chat != null;
  }

  Future<Devotion> getDevotion(String id) async {
    if (await _hasLocalDevotion(id)) {
      return (await _getLocalDevotion(id))!;
    }
    return await _fetchDevotion(id);
  }

  Future<Devotion> refreshDevotion(String id) async {
    return await _fetchDevotion(id);
  }

  Future<Devotion?> _getLocalDevotion(String id) async {
    return await _isar.devotions.get(fastHash(id));
  }

  Future<Devotion> _fetchDevotion(String id) async {
    return await DevotionService.getDevotion(id: id).then((value) async {
      await _saveDevotion(value);
      return value;
    });
  }

  Future<int> _saveDevotion(Devotion chat) async {
    return await _isar.writeTxn(() => _isar.devotions.put(chat));
  }

  Future<void> deleteLocalDevotion(String id) async {
    await _isar.writeTxn(() => _isar.devotions.delete(fastHash(id)));
  }

  Future<List<Devotion>> getAllLocalDevotions() async {
    return await _isar.devotions.where().findAll();
  }
}
