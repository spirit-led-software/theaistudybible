import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/devotion/data.dart';

export 'devotion/image.dart' show DevotionImage;
export 'devotion/reaction.dart' show DevotionReaction;

part 'devotion.freezed.dart';
part 'devotion.g.dart';

@freezed
class Devotion with _$Devotion {
  const Devotion._();

  factory Devotion({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required DateTime date,
    required String bibleReading,
    required String summary,
    String? reflection,
    String? prayer,
    required bool failed,
  }) = _Devotion;

  factory Devotion.fromJson(Map<String, dynamic> json) =>
      _$DevotionFromJson(json);

  EmbeddedDevotion toEmbedded() {
    return EmbeddedDevotion(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      date: date,
      bibleReading: bibleReading,
      summary: summary,
      reflection: reflection,
      prayer: prayer,
      failed: failed,
    );
  }
}
