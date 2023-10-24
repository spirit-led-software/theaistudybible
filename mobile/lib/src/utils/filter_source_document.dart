import 'package:revelationsai/src/models/source_document.dart';

List<SourceDocument> filterSourceDocuments(List<SourceDocument> value) {
  final filteredSources = <SourceDocument>[];
  for (final prospect in value) {
    final foundMatch = filteredSources.any((unique) {
      if (unique.id == prospect.id) {
        return true;
      }
      if (prospect.metadata["name"] == unique.metadata["name"]) {
        if (prospect.metadata["type"].toString().toLowerCase() == "webpage" &&
            prospect.metadata["url"] == unique.metadata["url"]) {
          return true;
        }

        if (prospect.metadata["type"].toString().toLowerCase() == "file" &&
            prospect.metadata["loc"]["pageNumber"] ==
                unique.metadata["loc"]["pageNumber"] &&
            prospect.metadata["loc"]["lines"]["to"] ==
                unique.metadata["loc"]["lines"]["to"] &&
            prospect.metadata["loc"]["lines"]["from"] ==
                unique.metadata["loc"]["lines"]["from"]) {
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
