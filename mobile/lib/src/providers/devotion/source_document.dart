import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'source_document.g.dart';

@riverpod
class DevotionSourceDocuments extends _$DevotionSourceDocuments {
  late DevotionSourceDocumentManager _manager;

  @override
  FutureOr<List<SourceDocument>> build(String devotionId) async {
    _manager = await ref.watch(devotionSourceDocumentManagerProvider.future);
    return _manager.getSourceDocumentsByDevotionId(devotionId);
  }

  Future<List<SourceDocument>> refresh() async {
    final sourceDocs = await _manager.refreshSourceDocumentsByDevotionId(devotionId);
    state = AsyncData(sourceDocs);
    return sourceDocs;
  }
}

@Riverpod(keepAlive: true)
Future<DevotionSourceDocumentManager> devotionSourceDocumentManager(DevotionSourceDocumentManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionSourceDocumentManager(isar: isar);
}

class DevotionSourceDocumentManager {
  final Isar _isar;

  DevotionSourceDocumentManager({
    required Isar isar,
  }) : _isar = isar;

  Future<bool> _hasLocalSourceDocumentsForDevotionId(String devotionId) async {
    final messages = await _isar.storedSourceDocuments.where().devotionIdEqualTo(devotionId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<SourceDocument>> getSourceDocumentsByDevotionId(String devotionId) async {
    if (await _hasLocalSourceDocumentsForDevotionId(devotionId)) {
      return await _getLocalSourceDocumentsByDevotionId(devotionId);
    }

    return await _fetchSourceDocumentsByDevotionId(devotionId);
  }

  Future<List<SourceDocument>> _getLocalSourceDocumentsByDevotionId(String devotionId) async {
    final storedSourceDocs =
        await _isar.storedSourceDocuments.where().devotionIdEqualTo(devotionId).sortByDistance().findAll();
    return storedSourceDocs.map((e) => e.toRegular()).toList();
  }

  Future<List<SourceDocument>> _fetchSourceDocumentsByDevotionId(String devotionId) async {
    return await DevotionService.getDevotionSourceDocuments(
      id: devotionId,
    ).then((value) async {
      await _saveSourceDocuments(value.map((e) => e.copyWith(devotionId: devotionId)).toList());
      return value;
    });
  }

  Future<List<SourceDocument>> refreshSourceDocumentsByDevotionId(String devotionId) async {
    return await _fetchSourceDocumentsByDevotionId(devotionId);
  }

  Future<List<int>> _saveSourceDocuments(List<SourceDocument> messages) async {
    return await _isar.writeTxn(() async {
      return await Future.wait(messages.map((e) async {
        return await _isar.storedSourceDocuments.put(e.toStored());
      }));
    });
  }

  Future<void> deleteLocalSourceDocumentsByDevotionId(String devotionId) async {
    if (await _hasLocalSourceDocumentsForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final messages = await _isar.storedSourceDocuments.where().devotionIdEqualTo(devotionId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.storedSourceDocuments.delete(fastHash(e.id));
        }));
      });
    }
  }
}
