import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/data_source/pages.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/refresh_indicator.dart';
import 'package:url_launcher/url_launcher_string.dart';

class SourcesScreen extends HookConsumerWidget {
  const SourcesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dataSources = ref.watch(dataSourcesPagesProvider);
    final dataSourcesNotifier = ref.watch(dataSourcesPagesProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Sources'),
      ),
      body: dataSources.when(
        data: (data) {
          final sources = data.expand((element) => element).toList();
          return RAIRefreshIndicator(
            onRefresh: () async {
              await dataSourcesNotifier.refresh();
            },
            child: ListView.builder(
              itemCount: sources.length + 1,
              itemBuilder: (context, index) {
                if (index == sources.length) {
                  return dataSourcesNotifier.hasNextPage()
                      ? Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          child: ElevatedButton(
                            onPressed: () {
                              if (dataSourcesNotifier.isLoadingNextPage()) {
                                return;
                              }
                              dataSourcesNotifier.fetchNextPage();
                            },
                            child: dataSourcesNotifier.isLoadingNextPage()
                                ? SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: SpinKitSpinningLines(
                                      color: context.secondaryColor,
                                      size: 20,
                                    ),
                                  )
                                : const Text('Load more'),
                          ),
                        )
                      : const SizedBox();
                }

                final dataSource = sources[index];
                return ListTile(
                  onTap: () async {
                    await launchUrlString(
                      dataSource.url,
                      mode: LaunchMode.externalApplication,
                    );
                  },
                  title: Text(dataSource.title ?? dataSource.name),
                  subtitle: Text(dataSource.author ?? Uri.parse(dataSource.url).origin),
                  trailing: const FaIcon(
                    FontAwesomeIcons.arrowUpRightFromSquare,
                    size: 18,
                  ),
                );
              },
            ),
          );
        },
        loading: () => Center(
          child: SpinKitSpinningLines(
            color: context.colorScheme.primary,
          ),
        ),
        error: (error, stackTrace) => Center(child: Text(error.toString())),
      ),
    );
  }
}
