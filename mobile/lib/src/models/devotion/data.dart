import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';

part 'data.freezed.dart';
part 'data.g.dart';

@freezed
class DevotionData with _$DevotionData {
  factory DevotionData({
    required Devotion devotion,
    required List<DevotionImage> images,
    required List<SourceDocument> sourceDocuments,
    required List<DevotionReaction> reactions,
    required Map<DevotionReactionType, int> reactionCounts,
  }) = _DevotionData;

  factory DevotionData.fromJson(Map<String, dynamic> json) =>
      _$DevotionDataFromJson(json);
}
