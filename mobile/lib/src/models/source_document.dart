import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/devotion/data.dart';

part 'source_document.freezed.dart';
part 'source_document.g.dart';

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
    required String page_content,
  }) = _SourceDocument;

  factory SourceDocument.fromJson(Map<String, dynamic> json) =>
      _$SourceDocumentFromJson(json);

  EmbeddedSourceDocument toEmbedded() {
    return EmbeddedSourceDocument(
      id: id,
      metadata: jsonEncode(metadata),
      page_content: page_content,
    );
  }
}
