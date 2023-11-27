import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/data_source.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';

class DataSourceService {
  static Future<PaginatedEntitiesResponseData<DataSource>> getDataSources({
    PaginatedEntitiesRequestOptions options = const PaginatedEntitiesRequestOptions(),
    required String session,
  }) async {
    final response = await http.get(
      Uri.parse('${API.url}/data-sources?${options.searchQuery}'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
    );

    if (!response.ok) {
      throw response.exception;
    }

    final data = jsonDecode(utf8.decode(response.bodyBytes));

    return PaginatedEntitiesResponseData.fromJson(data, (json) {
      return DataSource.fromJson(json as Map<String, dynamic>);
    });
  }

  static Future<DataSource> getDataSource(String id, {required String session}) async {
    final response = await http.get(
      Uri.parse('${API.url}/data-sources/$id'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $session',
      },
    );

    if (!response.ok) {
      throw response.exception;
    }

    final data = jsonDecode(utf8.decode(response.bodyBytes));

    return DataSource.fromJson(data);
  }
}
