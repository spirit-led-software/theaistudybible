import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/data_source.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/data_source.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'repository.g.dart';

@Riverpod(keepAlive: true)
Future<DataSourceRepository> dataSourceRepository(DataSourceRepositoryRef ref) async {
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return DataSourceRepository(session);
}

class DataSourceRepository {
  final String _session;

  DataSourceRepository(this._session);

  Future<DataSource> get(String id) async {
    return await DataSourceService.getDataSource(id, session: _session);
  }

  Future<List<DataSource>> getPage(PaginatedEntitiesRequestOptions options) async {
    return await DataSourceService.getDataSources(options: options, session: _session).then((value) {
      return value.entities;
    });
  }
}

extension DataSourceRepositoryRefX on Ref {
  DataSourceRepository get dataSources => watch(dataSourceRepositoryProvider).requireValue;
}

extension DataSourceRepositoryWidgetRefX on WidgetRef {
  DataSourceRepository get dataSources => watch(dataSourceRepositoryProvider).requireValue;
}
