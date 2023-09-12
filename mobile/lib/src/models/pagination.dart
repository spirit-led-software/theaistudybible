import 'package:freezed_annotation/freezed_annotation.dart';

part 'pagination.freezed.dart';
part 'pagination.g.dart';

class PaginatedEntitiesRequestOptions {
  final int page;
  final int limit;
  final String orderBy;
  final String order;

  const PaginatedEntitiesRequestOptions({
    this.page = 1,
    this.limit = 10,
    this.orderBy = "createdAt",
    this.order = "desc",
  });

  String get searchQuery {
    return "page=${Uri.encodeComponent(
      page.toString(),
    )}&limit=${Uri.encodeComponent(
      limit.toString(),
    )}&orderBy=${Uri.encodeComponent(
      orderBy,
    )}&order=${Uri.encodeComponent(
      order,
    )}";
  }
}

@Freezed(genericArgumentFactories: true)
class PaginatedEntitiesResponse<T> with _$PaginatedEntitiesResponse<T> {
  factory PaginatedEntitiesResponse.data({
    required int page,
    required int perPage,
    required List<T> entities,
  }) = PaginatedEntitiesResponseData;

  factory PaginatedEntitiesResponse.error({
    required String error,
  }) = PaginatedEntitiesResponseError;

  factory PaginatedEntitiesResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$PaginatedEntitiesResponseFromJson(json, fromJsonT);
}
