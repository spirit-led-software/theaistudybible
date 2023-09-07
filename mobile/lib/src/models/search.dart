import 'package:freezed_annotation/freezed_annotation.dart';

part 'search.freezed.dart';
part 'search.g.dart';

@freezed
class ColumnValue with _$ColumnValue {
  factory ColumnValue({
    required String column,
    required Object? value,
  }) = _ColumnValue;

  factory ColumnValue.fromJson(Map<String, dynamic> json) =>
      _$ColumnValueFromJson(json);
}

@freezed
class ColumnPlaceHolder with _$ColumnPlaceHolder {
  factory ColumnPlaceHolder({
    required String column,
    required String placeholder,
  }) = _ColumnPlaceHolder;

  factory ColumnPlaceHolder.fromJson(Map<String, dynamic> json) =>
      _$ColumnPlaceHolderFromJson(json);
}

@freezed
class Query with _$Query {
  factory Query({
    List<Query>? AND,
    List<Query>? OR,
    Query? NOT,
    ColumnValue? eq,
    ColumnValue? neq,
    ColumnValue? gt,
    ColumnValue? gte,
    ColumnValue? lt,
    ColumnValue? lte,
    ColumnPlaceHolder? like,
    ColumnPlaceHolder? iLike,
    ColumnPlaceHolder? notLike,
  }) = _Query;

  factory Query.fromJson(Map<String, dynamic> json) => _$QueryFromJson(json);
}
