import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'devotion.g.dart';

@riverpod
class Devotions extends _$Devotions {
  late String _id;

  @override
  FutureOr<Devotion> build(String? devotionId) async {
    _id = devotionId ?? (await ref.devotions.getLatest()).id;

    ref.onAddListener(() {
      ref.devotions.refresh(_id);
    });

    return await ref.devotions.get(_id);
  }

  Future<Devotion> refresh() async {
    final devotion = await ref.devotions.refresh(_id);
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

  Future<bool> _hasLocal(String id) async {
    final chat = await _isar.devotions.get(fastHash(id));
    return chat != null;
  }

  Future<Devotion> get(String id) async {
    if (await _hasLocal(id)) {
      return (await _getLocal(id))!;
    }
    return await _fetch(id);
  }

  Future<Devotion> refresh(String id) async {
    return await _fetch(id);
  }

  Future<Devotion?> _getLocal(String id) async {
    return await _isar.devotions.get(fastHash(id));
  }

  Future<Devotion> _fetch(String id) async {
    return await DevotionService.getDevotion(id: id).then((value) async {
      await _save(value);
      return value;
    });
  }

  Future<int> _save(Devotion chat) async {
    return await _isar.writeTxn(() => _isar.devotions.put(chat));
  }

  Future<List<int>> _saveMany(List<Devotion> chats) async {
    return await _isar.writeTxn(() => _isar.devotions.putAll(chats));
  }

  Future<void> deleteLocal(String id) async {
    await _isar.writeTxn(() => _isar.devotions.delete(fastHash(id)));
  }

  Future<List<Devotion>> getAllLocal() async {
    return await _isar.devotions.where().findAll();
  }

  Future<List<Devotion>> _fetchPage(PaginatedEntitiesRequestOptions options) async {
    return await DevotionService.getDevotions(paginationOptions: options).then((value) async {
      await _saveMany(value.entities);
      return value.entities;
    });
  }

  Future<List<Devotion>> getPage(PaginatedEntitiesRequestOptions options) async {
    if (await _isar.devotions.count() >= (options.page * options.limit)) {
      return await _isar.devotions
          .where()
          .sortByDateDesc()
          .offset((options.page - 1) * options.limit)
          .limit(options.limit)
          .findAll();
    }
    return await _fetchPage(options);
  }

  Future<List<Devotion>> refreshPage(PaginatedEntitiesRequestOptions options) async {
    return await _fetchPage(options);
  }

  Future<Devotion> getLatest() async {
    return await getPage(const PaginatedEntitiesRequestOptions(page: 1, limit: 1)).then((value) => value.first);
  }
}

extension DevotionManagerX on Ref {
  DevotionManager get devotions => watch(devotionManagerProvider).requireValue;
}
