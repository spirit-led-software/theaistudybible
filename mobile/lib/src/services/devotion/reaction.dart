import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/pagination.dart';

class DevotionReactionService {
  static Future<PaginatedEntitiesResponseData<DevotionReaction>>
      getDevotionReactions({
    required String id,
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
  }) async {
    Response res = await get(
      Uri.parse(
          '${API.url}/devotions/$id/reactions?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to load devotion images: ${res.statusCode} ${res.body}');
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));

    return PaginatedEntitiesResponseData.fromJson(
      data,
      (json) => DevotionReaction.fromJson(json as Map<String, dynamic>),
    );
  }

  static Future<Map<DevotionReactionType, int>> getDevotionReactionCounts({
    required String id,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/devotions/$id/reactions/counts'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to load devotion images: ${res.statusCode} ${res.body}');
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));

    return {
      DevotionReactionType.LIKE: data[DevotionReactionType.LIKE.name],
      DevotionReactionType.DISLIKE: data[DevotionReactionType.DISLIKE.name],
    };
  }

  static Future<void> createDevotionReaction({
    required String id,
    required DevotionReactionType reaction,
    required String session,
  }) async {
    Response res = await post(
      Uri.parse('${API.url}/devotions/$id/reactions'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(<String, String>{
        'reaction': reaction.name,
      }),
    );

    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(
          'Failed to create devotion reaction: ${res.statusCode} ${res.body}');
    }
  }
}
