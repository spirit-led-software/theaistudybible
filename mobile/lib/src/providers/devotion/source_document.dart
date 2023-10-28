import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'source_document.g.dart';

@riverpod
class DevotionSourceDocuments extends _$DevotionSourceDocuments {
  @override
  FutureOr<List<SourceDocument>> build(String devotionId) async {
    return ref.devotionSourceDocuments.getByDevotionId(devotionId);
  }

  Future<List<SourceDocument>> refresh() async {
    final sourceDocs = await ref.devotionSourceDocuments.refreshByDevotionId(devotionId);
    state = AsyncData(sourceDocs);
    return sourceDocs;
  }
}

@Riverpod(keepAlive: true)
Future<DevotionSourceDocumentManager> devotionSourceDocumentManager(DevotionSourceDocumentManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionSourceDocumentManager(isar);
}

class DevotionSourceDocumentManager {
  final Isar _isar;

  DevotionSourceDocumentManager(
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
    ).then((value) async {
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
        final messages = await _isar.storedSourceDocuments.where().devotionIdEqualTo(devotionId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.storedSourceDocuments.delete(fastHash(e.id));
        }));
      });
    }
  }
}

extension DevotionSourceDocumentsManagerX on Ref {
  DevotionSourceDocumentManager get devotionSourceDocuments =>
      watch(devotionSourceDocumentManagerProvider).requireValue;
}
