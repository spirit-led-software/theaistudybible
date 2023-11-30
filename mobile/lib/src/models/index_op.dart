import 'package:freezed_annotation/freezed_annotation.dart';

part 'index_op.freezed.dart';
part 'index_op.g.dart';

enum IndexOperationType {
  WEBSITE,
  FILE,
  WEBPAGE,
}

enum IndexOperationStatus {
  FAILED,
  SUCCEEDED,
  RUNNING,
  COMPLETED,
}

@freezed
class IndexOperation with _$IndexOperation {
  const IndexOperation._();

  factory IndexOperation({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required IndexOperationType type,
    required IndexOperationStatus status,
    Map<String, dynamic>? metadata,
  }) = _IndexOperation;

  @override
  // ignore: recursive_getters
  DateTime get createdAt => createdAt.toLocal();

  @override
  // ignore: recursive_getters
  DateTime get updatedAt => updatedAt.toLocal();

  factory IndexOperation.fromJson(Map<String, dynamic> json) => _$IndexOperationFromJson(json);
}
