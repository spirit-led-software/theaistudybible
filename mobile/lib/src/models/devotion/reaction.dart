import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/devotion/data.dart';

part 'reaction.freezed.dart';
part 'reaction.g.dart';

enum DevotionReactionType {
  LIKE,
  DISLIKE,
}

@freezed
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
    required String devotionId,
    required String userId,
    required DevotionReactionType reaction,
  }) = _DevotionReaction;

  factory DevotionReaction.fromJson(Map<String, dynamic> json) =>
      _$DevotionReactionFromJson(json);

  EmbeddedDevotionReaction toEmbedded() {
    return EmbeddedDevotionReaction(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      devotionId: devotionId,
      userId: userId,
      reaction: reaction,
    );
  }
}
