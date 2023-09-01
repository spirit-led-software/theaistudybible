import 'package:freezed_annotation/freezed_annotation.dart';

part 'source_document.freezed.dart';
part 'source_document.g.dart';

@freezed
class SourceDocument with _$SourceDocument {
  factory SourceDocument({
    /**
     * Convert from TypeScript:
    id: string;
    metadata?: Metadata;
    pageContent: string;
    embedding: string;
     */
    required String id,
    Map<String, dynamic>? metadata,
    required String page_content,
    List<dynamic>? embedding,
  }) = _SourceDocument;

  factory SourceDocument.fromJson(Map<String, dynamic> json) =>
      _$SourceDocumentFromJson(json);
}
