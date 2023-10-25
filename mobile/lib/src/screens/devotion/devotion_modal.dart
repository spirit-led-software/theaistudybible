import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/providers/devotion/data.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:visibility_detector/visibility_detector.dart';

class DevotionModal extends HookConsumerWidget {
  const DevotionModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devotionsPages = ref.watch(devotionsPagesProvider);
    final devotionsPagesNotifier = ref.watch(devotionsPagesProvider.notifier);

    return Container(
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
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
                      return await ref.refresh(devotionsPagesProvider.future);
                    },
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: devotionsPages.requireValue
                              .expand((element) => element)
                              .toList()
                              .length +
                          1,
                      itemBuilder: (listItemContext, index) {
                        if (index ==
                            devotionsPages.requireValue
                                .expand((element) => element)
                                .toList()
                                .length) {
                          return devotionsPagesNotifier.isLoadingNextPage()
                              ? Container(
                                  padding: const EdgeInsets.all(10),
                                  child: Center(
                                    child: SpinKitSpinningLines(
                                      color: listItemContext
                                          .colorScheme.onBackground,
                                      size: 20,
                                    ),
                                  ),
                                )
                              : devotionsPagesNotifier.hasNextPage()
                                  ? Container(
                                      padding: const EdgeInsets.all(10),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: ElevatedButton(
                                              onPressed: () {
                                                devotionsPagesNotifier
                                                    .fetchNextPage();
                                              },
                                              child: const Text('Show More'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  : Container();
                        }

                        final devotionsFlat = devotionsPages.requireValue
                            .expand((element) => element)
                            .toList();
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

    final fetchDevoData = useCallback(() async {
      final devotionDataManager = ref.read(devotionDataManagerProvider);
      await Future.wait([
        ref.read(devotionsProvider(devotion.id).future),
        ref.read(devotionSourceDocumentsProvider(devotion.id).future),
        ref.read(devotionImagesProvider(devotion.id).future),
        ref.read(devotionReactionsProvider(devotion.id).future),
        ref.read(devotionReactionCountsProvider(devotion.id).future),
      ]).then((value) {
        final foundDevo = value[0] as Devotion;
        final foundSourceDocs = value[1] as List<SourceDocument>;
        final foundImages = value[2] as List<DevotionImage>;
        final foundReactions = value[3] as List<DevotionReaction>;
        final foundReactionCounts = value[4] as Map<DevotionReactionType, int>;

        devotionDataManager.value?.addDevotion(
          DevotionData(
            id: foundDevo.id,
            devotion: foundDevo.toEmbedded(),
            images: foundImages.map((e) => e.toEmbedded()).toList(),
            sourceDocuments:
                foundSourceDocs.map((e) => e.toEmbedded()).toList(),
            reactions: foundReactions.map((e) => e.toEmbedded()).toList(),
            reactionCounts: foundReactionCounts.entries
                .map((e) => EmbeddedReactionCounts(
                      type: e.key,
                      count: e.value,
                    ))
                .toList(),
          ),
        );
      });
    }, [ref, devotion.id]);

    return VisibilityDetector(
      key: ValueKey(devotion.id),
      onVisibilityChanged: (info) async {
        if (info.visibleFraction == 1 &&
            !(await ref
                    .read(devotionDataManagerProvider)
                    .value
                    ?.hasDevotion(devotion.id) ??
                false)) {
          await fetchDevoData();
        }
      },
      child: Container(
        color: currentDevotionId.value == devotion.id
            ? context.secondaryColor.withOpacity(0.2)
            : null,
        child: ListTile(
          title: Text(DateFormat.yMMMd().format(devotion.date)),
          subtitle: Text(
            devotion.bibleReading.split(" - ").first,
          ),
          trailing: currentDevotionId.value == devotion.id
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
      ),
    );
  }
}
