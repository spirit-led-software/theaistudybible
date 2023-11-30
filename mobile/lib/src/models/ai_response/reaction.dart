import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

part 'reaction.freezed.dart';
part 'reaction.g.dart';

enum AiResponseReactionType {
  LIKE,
  DISLIKE,
}

@freezed
@Collection(ignore: {'copyWith'})
class AiResponseReaction with _$AiResponseReaction {
  const AiResponseReaction._();

  factory AiResponseReaction({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Index() required String aiResponseId,
    required String userId,
    required AiResponseReactionType reaction,
    String? comment,
  }) = _AiResponseReaction;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  @override
  @enumerated
  // ignore: recursive_getters
  AiResponseReactionType get reaction => reaction;

  factory AiResponseReaction.fromJson(Map<String, dynamic> json) => _$AiResponseReactionFromJson(json);
}
