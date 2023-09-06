import 'dart:convert';

import 'package:http/http.dart';
import 'package:revelationsai/src/constants/Api.dart';
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
      Uri.parse('${Api.url}/ai-responses?${paginationOptions.searchQuery}'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
      },
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load ai responses');
    }

    var data = jsonDecode(res.body);

    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return AiResponse.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<AiResponse> getAiResponse({
    required String id,
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${Api.url}/ai-responses/$id'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
      },
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load ai response');
    }

    var data = jsonDecode(res.body);

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
        '${Api.url}/ai-responses/search?${paginationOptions.searchQuery}',
      ),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
      },
      body: jsonEncode(query.toJson()),
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to search for ai responses');
    }

    var data = jsonDecode(res.body);

    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return AiResponse.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<List<SourceDocument>> getAiResponseSourceDocuments({
    required String id,
    required String session,
  }) async {
    Response res = await get(
      Uri.parse('${Api.url}/ai-responses/$id/source-documents'),
      headers: <String, String>{
        'Authorization': 'Bearer $session',
      },
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load AI response source documents');
    }

    var data = jsonDecode(res.body);

    return (data as List<dynamic>)
        .map((e) => SourceDocument.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
