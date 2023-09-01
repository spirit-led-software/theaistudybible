import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/user/role.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class User with _$User {
  factory User({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String session,
    required String email,
    String? name,
    String? image,
    String? stripeCustomerId,
    required List<Role> roles,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
