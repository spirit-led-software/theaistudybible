import 'package:freezed_annotation/freezed_annotation.dart';

part 'image.freezed.dart';
part 'image.g.dart';

@freezed
class DevotionImage with _$DevotionImage {
  factory DevotionImage({
    /* Convert from TypeScript:
    type DevotionImage = {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      devotionId: string;
      url: string;
      caption: string | null;
      prompt: string | null;
      negativePrompt: string | null;
    };
     */
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String devotionId,
    required String url,
    String? caption,
    String? prompt,
    String? negativePrompt,
  }) = _DevotionImage;

  factory DevotionImage.fromJson(Map<String, dynamic> json) =>
      _$DevotionImageFromJson(json);
}
