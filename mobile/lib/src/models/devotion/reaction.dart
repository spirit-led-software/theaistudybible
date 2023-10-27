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
    /* Convert from TypeScript:
    type DevotionReaction = {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      devotionId: string;
      userId: string;
      reaction: "LIKE" | "DISLIKE";
    }
    */
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Index() required String devotionId,
    required String userId,
    required DevotionReactionType reaction,
  }) = _DevotionReaction;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  @override
  @enumerated
  // ignore: recursive_getters
  DevotionReactionType get reaction => reaction;

  factory DevotionReaction.fromJson(Map<String, dynamic> json) => _$DevotionReactionFromJson(json);
}
