import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/devotion/data.dart';

part 'source_document.freezed.dart';
part 'source_document.g.dart';

enum DistanceMetric { cosine, l2, innerProduct }

@freezed
class SourceDocument with _$SourceDocument {
  const SourceDocument._();

  factory SourceDocument({
    /**
     * Convert from TypeScript:
    id: string;
    metadata?: Metadata;
    pageContent: string;
     */
    required String id,
    required Map<String, dynamic> metadata,
    required String pageContent,
    required double distance,
    required DistanceMetric distanceMetric,
  }) = _SourceDocument;

  factory SourceDocument.fromJson(Map<String, dynamic> json) =>
      _$SourceDocumentFromJson(json);

  EmbeddedSourceDocument toEmbedded() {
    return EmbeddedSourceDocument(
      id: id,
      metadata: jsonEncode(metadata),
      pageContent: pageContent,
      distance: distance,
      distanceMetric: distanceMetric,
    );
  }

  String get name => metadata['name'] ?? '';

  String get url => metadata['url'] ?? '';

  bool get isFile => metadata['type'].toString().toLowerCase() == 'file';
  bool get isWebpage => metadata['type'].toString().toLowerCase() == 'webpage';

  bool get hasPageNumber => metadata["loc"]["pageNumber"] != null;
  int get pageNumber => metadata["loc"]["pageNumber"] ?? 0;

  bool get hasLines => metadata["loc"]["lines"] != null;
  int get linesTo => metadata["loc"]["lines"]["to"] ?? 0;
  int get linesFrom => metadata["loc"]["lines"]["from"] ?? 0;
}
