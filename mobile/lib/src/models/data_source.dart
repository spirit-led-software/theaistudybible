import 'package:freezed_annotation/freezed_annotation.dart';

part 'data_source.freezed.dart';
part 'data_source.g.dart';

enum DataSourceType {
  WEB_CRAWL,
  FILE,
  WEBPAGE,
  REMOTE_FILE,
  YOUTUBE,
}

@freezed
class DataSource with _$DataSource {
  const DataSource._();

  factory DataSource({
    required String id,
    required String name,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String url,
    required DataSourceType type,
    required Map<String, dynamic> metadata,
    required int numberOfDocuments,
    required String syncSchedule,
    required DateTime? lastManualSync,
    required DateTime? lastAutomaticSync,
  }) = _DataSource;

  String? get title => metadata['title'];
  String? get author => metadata['author'];

  factory DataSource.fromJson(Map<String, dynamic> json) => _$DataSourceFromJson(json);
}
