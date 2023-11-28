import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

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
    String? devotionId,
    String? aiResponseId,
  }) = _SourceDocument;

  factory SourceDocument.fromJson(Map<String, dynamic> json) => _$SourceDocumentFromJson(json);

  String get name => metadata['name'] ?? '';

  String get url => metadata['url'] ?? '';

  bool get isFile => metadata['type'].toString().toLowerCase() == 'file';
  bool get isWebpage => metadata['type'].toString().toLowerCase() == 'webpage';
  bool get isYoutube => metadata['type'].toString().toLowerCase() == 'youtube';

  bool get hasTitle => metadata['title'] != null;
  String? get title => metadata['title'];

  bool get hasAuthor => metadata['author'] != null;
  String? get author => metadata['author'];

  bool get hasPageNumber => metadata["loc"]["pageNumber"] != null;
  int? get pageNumber => metadata["loc"]["pageNumber"];

  bool get hasPageNumbers => metadata["loc"]["pageNumbers"] != null;
  Map<String, dynamic>? get pageNumbers => metadata["loc"]["pageNumbers"];

  List<Map<String, int>>? getLinesForPage(int pageNumber) => metadata["loc"]["pageNumbers"][pageNumber.toString()];

  bool get hasLines => metadata["loc"]["lines"] != null;
  int? get linesTo => metadata["loc"]["lines"]["to"];
  int? get linesFrom => metadata["loc"]["lines"]["from"];

  StoredSourceDocument toStored() {
    return StoredSourceDocument(
      id: id,
      metadata: jsonEncode(metadata),
      pageContent: pageContent,
      distance: distance,
      distanceMetric: distanceMetric,
      devotionId: devotionId,
      aiResponseId: aiResponseId,
    );
  }
}

@freezed
@Collection(ignore: {'copyWith'})
class StoredSourceDocument with _$StoredSourceDocument {
  const StoredSourceDocument._();

  factory StoredSourceDocument({
    required String id,
    required String metadata,
    required String pageContent,
    required double distance,
    required DistanceMetric distanceMetric,
    @Index() String? devotionId,
    @Index() String? aiResponseId,
  }) = _StoredSourceDocument;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  @override
  @enumerated
  // ignore: recursive_getters
  DistanceMetric get distanceMetric => distanceMetric;

  factory StoredSourceDocument.fromJson(Map<String, dynamic> json) => _$StoredSourceDocumentFromJson(json);

  SourceDocument toRegular() {
    return SourceDocument(
      id: id,
      metadata: jsonDecode(metadata),
      pageContent: pageContent,
      distance: distance,
      distanceMetric: distanceMetric,
      devotionId: devotionId,
      aiResponseId: aiResponseId,
    );
  }
}
