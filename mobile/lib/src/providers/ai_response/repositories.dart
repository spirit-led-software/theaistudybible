import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/ai_response.dart';
import 'package:revelationsai/src/utils/filter_source_document.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'repositories.g.dart';

@Riverpod(keepAlive: true)
Future<AiResponseSourceDocumentRepository> aiResponseSourceDocumentRepository(
  AiResponseSourceDocumentRepositoryRef ref,
) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return AiResponseSourceDocumentRepository(isar, session);
}

class AiResponseSourceDocumentRepository {
  final Isar _isar;
  final String _session;

  AiResponseSourceDocumentRepository(
    Isar isar,
    String session,
  )   : _isar = isar,
        _session = session;

  Future<bool> _hasLocalForAiResponseId(String aiResponseId) async {
    final sourceDocs = await _isar.storedSourceDocuments.where().aiResponseIdEqualTo(aiResponseId).findAll();
    return sourceDocs.isNotEmpty;
  }

  Future<List<SourceDocument>> getByAiResponseId(String aiResponseId) async {
    if (await _hasLocalForAiResponseId(aiResponseId)) {
      return await _getLocalByAiResponseId(aiResponseId);
    }

    return await _fetchByAiResponseId(aiResponseId);
  }

  Future<List<SourceDocument>> _getLocalByAiResponseId(String aiResponseId) async {
    final storedSources =
        await _isar.storedSourceDocuments.where().aiResponseIdEqualTo(aiResponseId).sortByDistance().findAll();
    return storedSources.map((e) => e.toRegular()).toList();
  }

  Future<List<SourceDocument>> _fetchByAiResponseId(String aiResponseId) async {
    return AiResponseService.getAiResponseSourceDocuments(
      id: aiResponseId,
      session: _session,
    ).then((value) => filterSourceDocuments(value)).then((value) async {
      await deleteLocalByAiResponseId(aiResponseId);
      await save(value.map((e) {
        return e.copyWith(
          aiResponseId: aiResponseId,
        );
      }).toList());
      return value;
    });
  }

  Future<List<SourceDocument>> refreshByAiResponseId(String aiResponseId) async {
    return await _fetchByAiResponseId(aiResponseId);
  }

  Future<List<int>> save(List<SourceDocument> sourceDocuments) async {
    return await _isar.writeTxn(() async {
      return await _isar.storedSourceDocuments.putAll(sourceDocuments.map((e) => e.toStored()).toList());
    });
  }

  Future<void> deleteLocalByAiResponseId(String aiResponseId) async {
    if (await _hasLocalForAiResponseId(aiResponseId)) {
      await _isar.writeTxn(() async {
        final storedSources = await _isar.storedSourceDocuments.where().aiResponseIdEqualTo(aiResponseId).findAll();
        await _isar.storedSourceDocuments.deleteAll(storedSources.map((e) => e.isarId).toList());
      });
    }
  }
}

extension AiResponseRepositoryRefX on Ref {
  AiResponseSourceDocumentRepository get aiResponseSourceDocuments =>
      watch(aiResponseSourceDocumentRepositoryProvider).requireValue;
}

extension AiResponseRepositoryWidgetRefX on WidgetRef {
  AiResponseSourceDocumentRepository get aiResponseSourceDocuments =>
      watch(aiResponseSourceDocumentRepositoryProvider).requireValue;
}
