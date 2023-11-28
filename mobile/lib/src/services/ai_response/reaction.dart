import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/ai_response/reaction.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';

class AiResponseReactionService {
  static Future<PaginatedEntitiesResponseData<AiResponseReaction>> getAiResponseReactions({
    required String id,
    PaginatedEntitiesRequestOptions paginationOptions = const PaginatedEntitiesRequestOptions(),
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/ai-responses/$id/reactions?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (!res.ok) {
      throw res.exception;
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return PaginatedEntitiesResponseData.fromJson(
      data,
      (json) => AiResponseReaction.fromJson(json as Map<String, dynamic>),
    );
  }

  static Future<void> createAiResponseReaction({
    required String id,
    required AiResponseReactionType reaction,
    String? comment,
    required String session,
  }) async {
    Response res = await post(
      Uri.parse('${API.url}/ai-responses/$id/reactions'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(<String, String?>{
        'reaction': reaction.name,
        'comment': comment,
      }),
    );

    if (!res.ok) {
      throw res.exception;
    }
  }
}
