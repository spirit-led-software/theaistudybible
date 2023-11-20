import 'dart:math';

import 'package:revelationsai/src/models/source_document.dart';

const contentSeparator = '---------';

List<SourceDocument> filterSourceDocuments(List<SourceDocument> value) {
  final filteredSources = <SourceDocument>[];
  for (final prospect in value) {
    final matches = filteredSources.where((element) => element.id == prospect.id || element.url == prospect.url);
    if (matches.isEmpty) {
      if (prospect.isFile) {
        if (prospect.hasPageNumber && prospect.hasLines) {
          final newMetadata = Map.of(prospect.metadata)
            ..addAll({
              'loc': {
                ...prospect.metadata['loc'],
                'pageNumbers': {
                  prospect.pageNumber.toString(): [
                    {
                      'from': prospect.linesFrom!,
                      'to': prospect.linesTo!,
                    },
                  ],
                }
              }
            });
          filteredSources.add(prospect.copyWith(
            metadata: newMetadata,
          ));
          continue;
        }
      }
      filteredSources.add(prospect);
      continue;
    }

    for (final match in matches.toList()) {
      if (prospect.isWebpage && prospect.url == match.url) {
        filteredSources.removeWhere((element) => element.id == match.id);
        filteredSources.add(prospect.copyWith(
          pageContent: "${match.pageContent}\n$contentSeparator\n${prospect.pageContent}",
          distance: min(
            prospect.distance,
            match.distance,
          ),
        ));
        continue;
      }

      if (prospect.isFile) {
        if (prospect.hasPageNumber && prospect.hasLines) {
          final newMetadata = Map.of(prospect.metadata)
            ..addAll({
              'loc': {
                ...match.metadata['loc'],
                ...prospect.metadata['loc'],
                'pageNumbers': {
                  if (match.hasPageNumbers) ...match.pageNumbers!,
                  prospect.pageNumber.toString(): [
                    if (match.hasPageNumbers && match.getLinesForPage(prospect.pageNumber!) != null)
                      ...match.getLinesForPage(prospect.pageNumber!)!,
                    {
                      'from': prospect.linesFrom!,
                      'to': prospect.linesTo!,
                    },
                  ],
                }
              }
            });
          filteredSources.removeWhere((element) => element.id == match.id);
          filteredSources.add(prospect.copyWith(
            metadata: newMetadata,
            pageContent: "${match.pageContent}\n$contentSeparator\n${prospect.pageContent}",
            distance: min(
              prospect.distance,
              match.distance,
            ),
          ));
          continue;
        }
      }
      filteredSources.add(prospect.copyWith(
        pageContent: "${match.pageContent}\n$contentSeparator\n${prospect.pageContent}",
        distance: min(prospect.distance, match.distance),
      ));
    }
  }
  return filteredSources;
}
