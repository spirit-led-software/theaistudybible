import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/ai_response/repositories.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'source_document.g.dart';

@riverpod
class AiResponseSourceDocuments extends _$AiResponseSourceDocuments {
  @override
  FutureOr<List<SourceDocument>> build(String? aiResponseId) async {
    if (aiResponseId == null) {
      return <SourceDocument>[];
    }
    return await ref.aiResponseSourceDocuments.getByAiResponseId(aiResponseId);
  }

  Future<List<SourceDocument>> refresh() async {
    if (aiResponseId == null) {
      final sourceDocs = <SourceDocument>[];
      state = AsyncValue.data(sourceDocs);
      return sourceDocs;
    }
    final sourceDocs = await ref.aiResponseSourceDocuments.refreshByAiResponseId(aiResponseId!);
    state = AsyncValue.data(sourceDocs);
    return sourceDocs;
  }
}
