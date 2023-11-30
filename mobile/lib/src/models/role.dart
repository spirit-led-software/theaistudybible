import 'package:freezed_annotation/freezed_annotation.dart';

part 'role.freezed.dart';
part 'role.g.dart';

@freezed
class Role with _$Role {
  const Role._();

  factory Role({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String name,
    required List<String> permissions,
  }) = _Role;

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  factory Role.fromJson(Map<String, dynamic> json) => _$RoleFromJson(json);
}
