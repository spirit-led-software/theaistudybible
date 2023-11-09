import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

export 'devotion/image.dart' show DevotionImage;
export 'devotion/reaction.dart' show DevotionReaction;

part 'devotion.freezed.dart';
part 'devotion.g.dart';

@freezed
@Collection(ignore: {'copyWith'})
class Devotion with _$Devotion {
  const Devotion._();

  factory Devotion({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required DateTime date,
    required String topic,
    required String bibleReading,
    required String summary,
    String? reflection,
    String? prayer,
    required bool failed,
  }) = _Devotion;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  factory Devotion.fromJson(Map<String, dynamic> json) => _$DevotionFromJson(json);
}
