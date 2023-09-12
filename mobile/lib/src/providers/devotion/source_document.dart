import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'source_document.g.dart';

@riverpod
class DevotionSourceDocuments extends _$DevotionSourceDocuments {
  @override
  FutureOr<List<SourceDocument>> build(String id) {
    return DevotionService.getDevotionSourceDocuments(
      id: id,
    );
  }
}
