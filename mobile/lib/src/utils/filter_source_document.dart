import 'package:revelationsai/src/models/source_document.dart';

List<SourceDocument> filterSourceDocuments(List<SourceDocument> value) {
  final filteredSources = <SourceDocument>[];
  for (final prospect in value) {
    final foundMatch = filteredSources.any((unique) {
      if (unique.id == prospect.id) {
        return true;
      }
      if (prospect.name == unique.name) {
        if (prospect.isWebpage && prospect.url == unique.url) {
          return true;
        }

        if (prospect.isFile &&
            prospect.pageNumber == unique.pageNumber &&
            prospect.linesTo == unique.linesTo &&
            prospect.linesFrom == unique.linesFrom) {
          return true;
        }

        return false;
      }
      return false;
    });
    if (foundMatch) {
      continue;
    }
    filteredSources.add(prospect);
  }
  return filteredSources;
}
