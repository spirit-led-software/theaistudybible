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
    ).then((value) => _filterSourceDocuments(value));
  }

  List<SourceDocument> _filterSourceDocuments(List<SourceDocument> value) {
    final sourceDocuments = <SourceDocument>[];
    for (final sourceDocument in value) {
      final foundMatch = sourceDocuments.any((element) {
        if (element.id == sourceDocument.id) {
          return true;
        }
        if (sourceDocument.metadata["name"] == element.metadata["name"] &&
            sourceDocument.metadata["url"] == element.metadata["url"]) {
          return true;
        }
        return false;
      });
      if (foundMatch) {
        continue;
      }
      sourceDocuments.add(sourceDocument);
    }
    return sourceDocuments;
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
