import 'package:freezed_annotation/freezed_annotation.dart';

export 'devotion/image.dart' show DevotionImage;
export 'devotion/reaction.dart' show DevotionReaction;

part 'devotion.freezed.dart';
part 'devotion.g.dart';

@freezed
class Devotion with _$Devotion {
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
}
