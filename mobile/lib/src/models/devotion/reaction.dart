import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

part 'reaction.freezed.dart';
part 'reaction.g.dart';

enum DevotionReactionType {
  LIKE,
  DISLIKE,
}

@freezed
@Collection(ignore: {'copyWith'})
class DevotionReaction with _$DevotionReaction {
  const DevotionReaction._();

  factory DevotionReaction({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Index() required String devotionId,
    required String userId,
    required DevotionReactionType reaction,
    String? comment,
  }) = _DevotionReaction;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  @override
  @enumerated
  // ignore: recursive_getters
  DevotionReactionType get reaction => reaction;

  factory DevotionReaction.fromJson(Map<String, dynamic> json) => _$DevotionReactionFromJson(json);
}

@freezed
@Collection(ignore: {'copyWith'})
class DevotionReactionCount with _$DevotionReactionCount {
  const DevotionReactionCount._();

  factory DevotionReactionCount({
    required DevotionReactionType type,
    required int count,
    @Index() required String devotionId,
  }) = _DevotionReactionCount;

  Id get isarId => fastHash(devotionId + type.toString());

  @override
  @enumerated
  // ignore: recursive_getters
  DevotionReactionType get type => type;

  factory DevotionReactionCount.fromJson(Map<String, dynamic> json) => _$DevotionReactionCountFromJson(json);
}
