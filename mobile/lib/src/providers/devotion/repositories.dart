import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/image.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/services/devotion/reaction.dart';
import 'package:revelationsai/src/utils/filter_source_document.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'repositories.g.dart';

@Riverpod(keepAlive: true)
Future<DevotionRepository> devotionRepository(DevotionRepositoryRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionRepository(isar: isar);
}

class DevotionRepository {
  final Isar _isar;

  DevotionRepository({
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

@Riverpod(keepAlive: true)
Future<DevotionImageRepository> devotionImageRepository(DevotionImageRepositoryRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionImageRepository(isar: isar);
}

class DevotionImageRepository {
  final Isar _isar;

  DevotionImageRepository({
    required Isar isar,
  }) : _isar = isar;

  Future<bool> _hasLocalForDevotionId(String devotionId) async {
    final messages = await _isar.devotionImages.where().devotionIdEqualTo(devotionId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<DevotionImage>> getByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      return await _getLocalByDevotionId(devotionId);
    }

    return await _fetchByDevotionId(devotionId);
  }

  Future<List<DevotionImage>> _getLocalByDevotionId(String devotionId) async {
    return await _isar.devotionImages.where().devotionIdEqualTo(devotionId).sortByCreatedAt().findAll();
  }

  Future<List<DevotionImage>> _fetchByDevotionId(String devotionId) async {
    return await DevotionImageService.getDevotionImages(
      id: devotionId,
    ).then((value) async {
      await _save(value.entities);
      return value.entities;
    });
  }

  Future<List<DevotionImage>> refreshByDevotionId(String devotionId) async {
    return await _fetchByDevotionId(devotionId);
  }

  Future<List<int>> _save(List<DevotionImage> messages) async {
    return await _isar.writeTxn(() async {
      return await _isar.devotionImages.putAll(messages);
    });
  }

  Future<void> deleteLocalByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final images = await _isar.devotionImages.where().devotionIdEqualTo(devotionId).findAll();
        await _isar.devotionImages.deleteAll(images.map((e) => e.isarId).toList());
      });
    }
  }
}

@Riverpod(keepAlive: true)
Future<DevotionReactionRepository> devotionReactionRepository(DevotionReactionRepositoryRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return DevotionReactionRepository(isar, session);
}

class DevotionReactionRepository {
  final Isar _isar;
  final String _session;

  DevotionReactionRepository(
    Isar isar,
    String session,
  )   : _isar = isar,
        _session = session;

  Future<bool> _hasLocalForDevotionId(String devotionId) async {
    final reactions = await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).findAll();
    return reactions.isNotEmpty;
  }

  Future<List<DevotionReaction>> getByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      return await _getLocalByDevotionId(devotionId);
    }

    return await _fetchByDevotionId(devotionId);
  }

  Future<List<DevotionReaction>> _getLocalByDevotionId(String devotionId) async {
    return await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).sortByCreatedAt().findAll();
  }

  Future<List<DevotionReaction>> _fetchByDevotionId(String devotionId) async {
    return await DevotionReactionService.getDevotionReactions(
      id: devotionId,
    ).then((value) async {
      await _save(value.entities);
      return value.entities;
    });
  }

  Future<List<DevotionReaction>> refreshByDevotionId(String devotionId) async {
    return await _fetchByDevotionId(devotionId);
  }

  Future<void> createForDevotionId(String devotionId, DevotionReactionType type) async {
    return await DevotionReactionService.createDevotionReaction(id: devotionId, session: _session, reaction: type)
        .then((value) async {
      await _fetchByDevotionId(devotionId);
    });
  }

  Future<List<int>> _save(List<DevotionReaction> reactions) async {
    return await _isar.writeTxn(() async {
      return await _isar.devotionReactions.putAll(reactions);
    });
  }

  Future<void> deleteLocalByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final reactions = await _isar.devotionReactions.where().devotionIdEqualTo(devotionId).findAll();
        await _isar.devotionReactions.deleteAll(reactions.map((e) => e.isarId).toList());
      });
    }
  }

  Future<Map<DevotionReactionType, int>> getCountsForDevotionId(String devotionId) async {
    if (await _hasLocalCountsForDevotionId(devotionId)) {
      return await _getLocalCountsForDevotionId(devotionId);
    }
    return await _fetchCountsForDevotionId(devotionId);
  }

  Future<Map<DevotionReactionType, int>> refreshCountsForDevotionId(String devotionId) async {
    return await _fetchCountsForDevotionId(devotionId);
  }

  Future<bool> _hasLocalCountsForDevotionId(String devotionId) async {
    final counts = await _isar.devotionReactionCounts.where().devotionIdEqualTo(devotionId).findAll();
    return counts.isNotEmpty;
  }

  Future<Map<DevotionReactionType, int>> _getLocalCountsForDevotionId(String devotionId) async {
    final counts = await _isar.devotionReactionCounts.where().devotionIdEqualTo(devotionId).findAll();
    return counts.fold<Map<DevotionReactionType, int>>({}, (previousValue, element) {
      previousValue[element.type] = element.count;
      return previousValue;
    });
  }

  Future<Map<DevotionReactionType, int>> _fetchCountsForDevotionId(String devotionId) async {
    return await DevotionReactionService.getDevotionReactionCounts(id: devotionId).then((value) {
      _saveCounts(value.entries
          .map((e) => DevotionReactionCount(type: e.key, count: e.value, devotionId: devotionId))
          .toList());
      return value;
    });
  }

  Future<List<int>> _saveCounts(List<DevotionReactionCount> counts) async {
    return await _isar.writeTxn(() async {
      return await _isar.devotionReactionCounts.putAll(counts);
    });
  }
}

@Riverpod(keepAlive: true)
Future<DevotionSourceDocumentRepository> devotionSourceDocumentRepository(
    DevotionSourceDocumentRepositoryRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionSourceDocumentRepository(isar);
}

class DevotionSourceDocumentRepository {
  final Isar _isar;

  DevotionSourceDocumentRepository(
    Isar isar,
  ) : _isar = isar;

  Future<bool> _hasLocalForDevotionId(String devotionId) async {
    final messages = await _isar.storedSourceDocuments.where().devotionIdEqualTo(devotionId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<SourceDocument>> getByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      return await _getLocalByDevotionId(devotionId);
    }

    return await _fetchByDevotionId(devotionId);
  }

  Future<List<SourceDocument>> _getLocalByDevotionId(String devotionId) async {
    final storedSourceDocs =
        await _isar.storedSourceDocuments.where().devotionIdEqualTo(devotionId).sortByDistance().findAll();
    return storedSourceDocs.map((e) => e.toRegular()).toList();
  }

  Future<List<SourceDocument>> _fetchByDevotionId(String devotionId) async {
    return await DevotionService.getDevotionSourceDocuments(
      id: devotionId,
    ).then((value) => filterSourceDocuments(value)).then((value) async {
      await deleteLocalByDevotionId(devotionId);
      await _save(value.map((e) => e.copyWith(devotionId: devotionId)).toList());
      return value;
    });
  }

  Future<List<SourceDocument>> refreshByDevotionId(String devotionId) async {
    return await _fetchByDevotionId(devotionId);
  }

  Future<List<int>> _save(List<SourceDocument> messages) async {
    return await _isar.writeTxn(() async {
      return await Future.wait(messages.map((e) async {
        return await _isar.storedSourceDocuments.put(e.toStored());
      }));
    });
  }

  Future<void> deleteLocalByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final sourceDocuments = await _isar.storedSourceDocuments.where().devotionIdEqualTo(devotionId).findAll();
        await _isar.storedSourceDocuments.deleteAll(sourceDocuments.map((e) => e.isarId).toList());
      });
    }
  }
}

extension DevotionRepositoryRefX on Ref {
  DevotionRepository get devotions => watch(devotionRepositoryProvider).requireValue;
  DevotionImageRepository get devotionImages => watch(devotionImageRepositoryProvider).requireValue;
  DevotionReactionRepository get devotionReactions => watch(devotionReactionRepositoryProvider).requireValue;
  DevotionSourceDocumentRepository get devotionSourceDocuments =>
      watch(devotionSourceDocumentRepositoryProvider).requireValue;
}

extension DevotionRepositoryWidgetRefX on WidgetRef {
  DevotionRepository get devotions => watch(devotionRepositoryProvider).requireValue;
  DevotionImageRepository get devotionImages => watch(devotionImageRepositoryProvider).requireValue;
  DevotionReactionRepository get devotionReactions => watch(devotionReactionRepositoryProvider).requireValue;
  DevotionSourceDocumentRepository get devotionSourceDocuments =>
      watch(devotionSourceDocumentRepositoryProvider).requireValue;
}
