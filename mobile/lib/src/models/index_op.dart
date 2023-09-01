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
  factory IndexOperation({
    /* Convert from TypeScript:
    type IndexOperation = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: "WEBSITE" | "FILE" | "WEBPAGE";
    status: "FAILED" | "SUCCEEDED" | "RUNNING" | "COMPLETED";
    metadata: unknown;
}
    */
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required IndexOperationType type,
    required IndexOperationStatus status,
    Map<String, dynamic>? metadata,
  }) = _IndexOperation;

  factory IndexOperation.fromJson(Map<String, dynamic> json) =>
      _$IndexOperationFromJson(json);
}
