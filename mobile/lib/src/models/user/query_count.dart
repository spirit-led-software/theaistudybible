import 'package:freezed_annotation/freezed_annotation.dart';

part 'query_count.freezed.dart';
part 'query_count.g.dart';

@freezed
class UserQueryCount with _$UserQueryCount {
  const UserQueryCount._();

  factory UserQueryCount({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String userId,
    required DateTime date,
    required int count,
  }) = _UserQueryCount;

  factory UserQueryCount.fromJson(Map<String, dynamic> json) => _$UserQueryCountFromJson(json);
}
