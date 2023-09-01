import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/Api.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/source_document.dart';

export 'devotion/image.dart' show DevotionImageService;

class DevotionService {
  static Future<PaginatedEntitiesResponseData<Devotion>> getDevotions({
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
  }) async {
    Response res = await get(
      Uri.parse('${Api.url}/devotions?${paginationOptions.searchQuery}'),
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load devotions');
    }

    var data = jsonDecode(res.body);

    return PaginatedEntitiesResponseData.fromJson(
        data, (json) => Devotion.fromJson(json as Map<String, dynamic>));
  }

  static Future<Devotion> getDevotion({
    required String id,
  }) async {
    Response res = await get(
      Uri.parse('${Api.url}/devotions/$id'),
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load devotion');
    }

    var data = jsonDecode(res.body);

    return Devotion.fromJson(data);
  }

  static Future<List<SourceDocument>> getDevotionSourceDocuments({
    required String id,
  }) async {
    Response res = await get(
      Uri.parse('${Api.url}/devotions/$id/source-documents'),
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load devotion source documents');
    }

    var data = jsonDecode(res.body);

    return (data as List<dynamic>)
        .map((e) => SourceDocument.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
