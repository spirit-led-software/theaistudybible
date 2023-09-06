import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/Api.dart';
import 'package:revelationsai/src/models/devotion/image.dart';
import 'package:revelationsai/src/models/pagination.dart';

class DevotionImageService {
  static Future<PaginatedEntitiesResponseData<DevotionImage>>
      getDevotionImages({
    required String id,
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
  }) async {
    Response res = await get(
      Uri.parse(
          '${Api.url}/devotions/$id/images?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load devotions');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return PaginatedEntitiesResponseData.fromJson(
      data,
      (json) => DevotionImage.fromJson(json as Map<String, dynamic>),
    );
  }
}
