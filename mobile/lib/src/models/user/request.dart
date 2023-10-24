import 'package:freezed_annotation/freezed_annotation.dart';

part 'request.freezed.dart';
part 'request.g.dart';

@freezed
class UpdateUserRequest with _$UpdateUserRequest {
  @JsonSerializable(includeIfNull: false)
  factory UpdateUserRequest({
    String? name,
    String? email,
    String? image,
  }) = _UpdateUserRequest;

  factory UpdateUserRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateUserRequestFromJson(json);
}

@freezed
class UpdatePasswordRequest with _$UpdatePasswordRequest {
  @JsonSerializable(includeIfNull: false)
  factory UpdatePasswordRequest({
    required String currentPassword,
    required String newPassword,
  }) = _UpdatePasswordRequest;

  factory UpdatePasswordRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdatePasswordRequestFromJson(json);
}
