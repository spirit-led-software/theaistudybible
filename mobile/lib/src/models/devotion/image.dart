import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

part 'image.freezed.dart';
part 'image.g.dart';

@freezed
@Collection(ignore: {'copyWith'})
class DevotionImage with _$DevotionImage {
  const DevotionImage._();

  factory DevotionImage({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Index() required String devotionId,
    required String url,
    String? caption,
    String? prompt,
    String? negativePrompt,
  }) = _DevotionImage;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  factory DevotionImage.fromJson(Map<String, dynamic> json) => _$DevotionImageFromJson(json);
}
