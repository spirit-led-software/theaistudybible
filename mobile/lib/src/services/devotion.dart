import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';

export 'devotion/image.dart' show DevotionImageService;

class DevotionService {
  static Future<PaginatedEntitiesResponseData<Devotion>> getDevotions({
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/devotions?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return PaginatedEntitiesResponseData.fromJson(
        data, (json) => Devotion.fromJson(json as Map<String, dynamic>));
  }

  static Future<Devotion> getDevotion({
    required String id,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/devotions/$id'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return Devotion.fromJson(data);
  }

  static Future<List<SourceDocument>> getDevotionSourceDocuments({
    required String id,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/devotions/$id/source-documents'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return (data as List<dynamic>)
        .map((e) => SourceDocument.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
