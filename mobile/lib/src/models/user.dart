import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:revelationsai/src/models/role.dart';

export 'user/message.dart' show UserMessage;
export 'user/query_count.dart' show UserQueryCount;

part 'user.freezed.dart';
part 'user.g.dart';

enum Translation {
  ESV,
  NIV,
  NKJV,
  NLT,
}

@freezed
class User with _$User {
  const User._();

  factory User({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String email,
    required Translation translation,
    String? name,
    String? image,
    String? stripeCustomerId,
  }) = _User;

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

@freezed
class UserInfo with _$UserInfo {
  const UserInfo._();

  factory UserInfo({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String session,
    required String email,
    required Translation translation,
    String? name,
    String? image,
    String? stripeCustomerId,
    required List<Role> roles,
    required int maxQueries,
    required int remainingQueries,
    required int maxGeneratedImages,
    required int remainingGeneratedImages,
  }) = _UserInfo;

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  factory UserInfo.fromJson(Map<String, dynamic> json) => _$UserInfoFromJson(json);
}
