import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/user.dart';

part 'request.freezed.dart';
part 'request.g.dart';

@freezed
class UpdateUserRequest with _$UpdateUserRequest {
  const UpdateUserRequest._();

  @JsonSerializable(includeIfNull: false)
  factory UpdateUserRequest({
    String? name,
    String? email,
    String? image,
    Translation? translation,
  }) = _UpdateUserRequest;

  factory UpdateUserRequest.fromJson(Map<String, dynamic> json) => _$UpdateUserRequestFromJson(json);
}

@freezed
class UpdatePasswordRequest with _$UpdatePasswordRequest {
  const UpdatePasswordRequest._();

  @JsonSerializable(includeIfNull: false)
  factory UpdatePasswordRequest({
    required String currentPassword,
    required String newPassword,
  }) = _UpdatePasswordRequest;

  factory UpdatePasswordRequest.fromJson(Map<String, dynamic> json) => _$UpdatePasswordRequestFromJson(json);
}
