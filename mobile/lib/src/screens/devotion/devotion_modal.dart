import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/utils/capitalization.dart';

class DevotionModal extends HookConsumerWidget {
  const DevotionModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devotionsPages = ref.watch(devotionsPagesProvider);
    final devotionsPagesNotifier = ref.watch(devotionsPagesProvider.notifier);

    return Container(
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        color: context.colorScheme.background,
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(
              top: 10,
              bottom: 10,
              left: 30,
            ),
            decoration: ShapeDecoration(
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              color: context.primaryColor,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'All Devotions',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: context.colorScheme.onPrimary,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: Icon(
                    Icons.close,
                    color: context.colorScheme.onPrimary,
                  ),
                ),
              ],
            ),
          ),
          devotionsPagesNotifier.isLoadingInitial()
              ? Expanded(
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: context.colorScheme.onBackground,
                      size: 32,
                    ),
                  ),
                )
              : Expanded(
                  child: RefreshIndicator(
                    onRefresh: () async {
                      await ref.read(devotionsPagesProvider.notifier).refresh();
                    },
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: devotionsPages.requireValue.expand((element) => element).toList().length + 1,
                      itemBuilder: (listItemContext, index) {
                        if (index == devotionsPages.requireValue.expand((element) => element).toList().length) {
                          return devotionsPagesNotifier.isLoadingNextPage()
                              ? Container(
                                  padding: const EdgeInsets.all(10),
                                  child: Center(
                                    child: SpinKitSpinningLines(
                                      color: listItemContext.colorScheme.onBackground,
                                      size: 20,
                                    ),
                                  ),
                                )
                              : devotionsPagesNotifier.hasNextPage()
                                  ? Container(
                                      padding: const EdgeInsets.all(5),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: ElevatedButton(
                                              onPressed: () {
                                                devotionsPagesNotifier.fetchNextPage();
                                              },
                                              child: const Text('Show More'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  : Container();
                        }

                        final devotionsFlat = devotionsPages.requireValue.expand((element) => element).toList();
                        final devotion = devotionsFlat[index];
                        return DevotionListItem(
                          key: ValueKey(devotion.id),
                          devotion: devotion,
                        );
                      },
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

class DevotionListItem extends HookConsumerWidget {
  final Devotion devotion;

  const DevotionListItem({Key? key, required this.devotion}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentDevotionId = ref.watch(currentDevotionIdProvider);

    return Container(
      key: ValueKey(devotion.id),
      color: currentDevotionId == devotion.id ? context.secondaryColor.withOpacity(0.2) : null,
      child: ListTile(
        visualDensity: VisualDensity.compact,
        title: Text(
          devotion.topic.toCapitalized(),
        ),
        subtitle: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              devotion.bibleReading.split(" - ").first,
            ),
            Text(
              DateFormat.yMMMMd().format(devotion.date.toUtc()),
            ),
          ],
        ),
        trailing: currentDevotionId == devotion.id
            ? Icon(
                Icons.check,
                color: context.secondaryColor,
              )
            : null,
        onTap: () {
          context.go(
            '/devotions/${devotion.id}',
          );
          Navigator.of(context).pop();
        },
      ),
    );
  }
}
