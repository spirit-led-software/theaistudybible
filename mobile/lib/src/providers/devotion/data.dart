import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'data.g.dart';

@Riverpod(keepAlive: true)
Future<DevotionDataManager> devotionDataManager(
    DevotionDataManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionDataManager(isar);
}

class DevotionDataManager {
  final Isar _isar;

  DevotionDataManager(this._isar);

  void addDevotion(DevotionData devotionData) async {
    await _isar.writeTxn(() async {
      await _isar.devotionDatas.put(devotionData);
    });
  }

  Future<DevotionData?> getDevotion(String id) async {
    return await _isar.devotionDatas.get(fastHash(id));
  }

  Future<bool> hasDevotion(String id) async {
    return await _isar.devotionDatas.get(fastHash(id)) != null;
  }

  Future<void> deleteDevotion(String id) async {
    await _isar.writeTxn(() async {
      await _isar.devotionDatas.delete(fastHash(id));
    });
  }

  Future<List<DevotionData>> getAllDevotions() async {
    return await _isar.devotionDatas.where().findAll();
  }
}
