import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/ai_response.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/models/source_document.dart';

class AiResponseService {
  static Future<PaginatedEntitiesResponseData<AiResponse>> getAiResponses({
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/ai-responses?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to load ai responses: ${res.statusCode} ${res.body}');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return AiResponse.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<AiResponse> getAiResponse({
    required String id,
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/ai-responses/$id'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to load ai response: ${res.statusCode} ${res.body}');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return AiResponse.fromJson(data);
  }

  static Future<PaginatedEntitiesResponseData<AiResponse>>
      searchForAiResponses({
    PaginatedEntitiesRequestOptions paginationOptions =
        const PaginatedEntitiesRequestOptions(),
    required Query query,
    required String session,
  }) async {
    Response res = await post(
      Uri.parse(
        '${API.url}/ai-responses/search?${paginationOptions.searchQuery}',
      ),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(query.toJson()),
    );

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to search for ai responses: ${res.statusCode} ${res.body}');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return AiResponse.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<List<SourceDocument>> getAiResponseSourceDocuments({
    required String id,
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${API.url}/ai-responses/$id/source-documents'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    );

    if (res.statusCode != 200) {
      throw Exception(
          'Failed to load AI response source documents: ${res.statusCode} ${res.body}');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));

    return (data as List<dynamic>)
        .map((e) => SourceDocument.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}