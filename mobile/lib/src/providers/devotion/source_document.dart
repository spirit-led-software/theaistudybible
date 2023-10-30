import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'source_document.g.dart';

@riverpod
class DevotionSourceDocuments extends _$DevotionSourceDocuments {
  late String _id;

  @override
  FutureOr<List<SourceDocument>> build(String? devotionId) async {
    _id = devotionId ?? (await ref.devotions.getLatest()).id;

    return ref.devotionSourceDocuments.getByDevotionId(_id);
  }

  Future<List<SourceDocument>> refresh() async {
    final sourceDocs = await ref.devotionSourceDocuments.refreshByDevotionId(_id);
    state = AsyncData(sourceDocs);
    return sourceDocs;
  }
}
