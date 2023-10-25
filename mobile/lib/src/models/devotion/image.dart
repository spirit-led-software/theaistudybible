import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/devotion/data.dart';

part 'image.freezed.dart';
part 'image.g.dart';

@freezed
class DevotionImage with _$DevotionImage {
  const DevotionImage._();

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

  EmbeddedDevotionImage toEmbedded() {
    return EmbeddedDevotionImage(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      devotionId: devotionId,
      url: url,
      caption: caption,
      prompt: prompt,
      negativePrompt: negativePrompt,
    );
  }
}
