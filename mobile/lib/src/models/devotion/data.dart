import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/utils/isar.dart';

part 'data.freezed.dart';
part 'data.g.dart';

@freezed
@Collection(ignore: {'copyWith'})
class DevotionData with _$DevotionData {
  const DevotionData._();

  factory DevotionData({
    required String id,
    required EmbeddedDevotion devotion,
    required List<EmbeddedDevotionImage> images,
    required List<EmbeddedSourceDocument> sourceDocuments,
    required List<EmbeddedDevotionReaction> reactions,
    required List<EmbeddedReactionCounts> reactionCounts,
  }) = _DevotionData;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  factory DevotionData.fromJson(Map<String, dynamic> json) =>
      _$DevotionDataFromJson(json);
}

@freezed
@Embedded(ignore: {'copyWith'})
class EmbeddedDevotion with _$EmbeddedDevotion {
  const EmbeddedDevotion._();

  factory EmbeddedDevotion({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? date,
    String? bibleReading,
    String? summary,
    String? reflection,
    String? prayer,
    bool? failed,
  }) = _EmbeddedDevotion;

  factory EmbeddedDevotion.fromJson(Map<String, dynamic> json) =>
      _$EmbeddedDevotionFromJson(json);

  Devotion toRegular() {
    return Devotion(
      id: id!,
      createdAt: createdAt!,
      updatedAt: updatedAt!,
      date: date!,
      bibleReading: bibleReading!,
      summary: summary!,
      reflection: reflection,
      prayer: prayer,
      failed: failed!,
    );
  }
}

@freezed
@Embedded(ignore: {'copyWith'})
class EmbeddedDevotionImage with _$EmbeddedDevotionImage {
  const EmbeddedDevotionImage._();

  factory EmbeddedDevotionImage({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? devotionId,
    String? url,
    String? caption,
    String? prompt,
    String? negativePrompt,
  }) = _EmbeddedDevotionImage;

  factory EmbeddedDevotionImage.fromJson(Map<String, dynamic> json) =>
      _$EmbeddedDevotionImageFromJson(json);

  DevotionImage toRegular() {
    return DevotionImage(
      id: id!,
      createdAt: createdAt!,
      updatedAt: updatedAt!,
      devotionId: devotionId!,
      url: url!,
      caption: caption,
      prompt: prompt,
      negativePrompt: negativePrompt,
    );
  }
}

@freezed
@Embedded(ignore: {'copyWith'})
class EmbeddedSourceDocument with _$EmbeddedSourceDocument {
  const EmbeddedSourceDocument._();

  factory EmbeddedSourceDocument({
    String? id,
    String? metadata,
    String? page_content,
  }) = _EmbeddedSourceDocument;

  factory EmbeddedSourceDocument.fromJson(Map<String, dynamic> json) =>
      _$EmbeddedSourceDocumentFromJson(json);

  SourceDocument toRegular() {
    return SourceDocument(
      id: id!,
      metadata: jsonDecode(metadata!),
      page_content: page_content!,
    );
  }
}

@freezed
@Embedded(ignore: {'copyWith'})
class EmbeddedDevotionReaction with _$EmbeddedDevotionReaction {
  const EmbeddedDevotionReaction._();

  factory EmbeddedDevotionReaction({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? devotionId,
    String? userId,
    @Default(DevotionReactionType.LIKE) DevotionReactionType reaction,
  }) = _EmbeddedDevotionReaction;

  @override
  @enumerated
  // ignore: recursive_getters
  DevotionReactionType get reaction => reaction;

  factory EmbeddedDevotionReaction.fromJson(Map<String, dynamic> json) =>
      _$EmbeddedDevotionReactionFromJson(json);

  DevotionReaction toRegular() {
    return DevotionReaction(
      id: id!,
      createdAt: createdAt!,
      updatedAt: updatedAt!,
      devotionId: devotionId!,
      userId: userId!,
      reaction: reaction,
    );
  }
}

@freezed
@Embedded(ignore: {'copyWith'})
class EmbeddedReactionCounts with _$EmbeddedReactionCounts {
  const EmbeddedReactionCounts._();

  factory EmbeddedReactionCounts({
    @Default(DevotionReactionType.LIKE) DevotionReactionType type,
    int? count,
  }) = _EmbeddedReactionCounts;

  @override
  @enumerated
  // ignore: recursive_getters
  DevotionReactionType get type => type;

  factory EmbeddedReactionCounts.fromJson(Map<String, dynamic> json) =>
      _$EmbeddedReactionCountsFromJson(json);

  MapEntry<DevotionReactionType, int> toMapEntry() {
    return MapEntry(type, count!);
  }
}
