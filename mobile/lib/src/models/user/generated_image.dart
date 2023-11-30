import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/utils/isar.dart';

part 'generated_image.freezed.dart';
part 'generated_image.g.dart';

@freezed
@Collection(ignore: {'copyWith'})
class UserGeneratedImage with _$UserGeneratedImage {
  const UserGeneratedImage._();

  factory UserGeneratedImage({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String userId,
    String? url,
    required String userPrompt,
    String? prompt,
    String? negativePrompt,
    required bool failed,
  }) = _UserGeneratedImage;

  // ignore: recursive_getters
  Id get isarId => fastHash(id);

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  factory UserGeneratedImage.fromJson(Map<String, dynamic> json) => _$UserGeneratedImageFromJson(json);
}

@freezed
class CreateUserGeneratedImageRequest with _$CreateUserGeneratedImageRequest {
  const factory CreateUserGeneratedImageRequest({required String prompt}) = _CreateUserGeneratedImageRequest;

  factory CreateUserGeneratedImageRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateUserGeneratedImageRequestFromJson(json);
}
