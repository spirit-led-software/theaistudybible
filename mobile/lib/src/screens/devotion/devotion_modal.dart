import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/data.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:visibility_detector/visibility_detector.dart';

class DevotionModal extends HookConsumerWidget {
  const DevotionModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devotions = ref.watch(devotionsPagesProvider);
    final devotionsNotifier = ref.watch(devotionsPagesProvider.notifier);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
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
              color: RAIColors.primary,
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'All Devotions',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(
                    Icons.close,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          devotionsNotifier.isLoadingInitial()
              ? Expanded(
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: RAIColors.primary,
                      size: 32,
                    ),
                  ),
                )
              : Expanded(
                  child: ListView.builder(
                    itemCount: devotions.requireValue
                            .expand((element) => element)
                            .toList()
                            .length +
                        1,
                    itemBuilder: (context, index) {
                      if (index ==
                          devotions.requireValue
                              .expand((element) => element)
                              .toList()
                              .length) {
                        return devotionsNotifier.isLoadingNextPage()
                            ? Container(
                                padding: const EdgeInsets.all(10),
                                child: Center(
                                  child: SpinKitSpinningLines(
                                    color: RAIColors.primary,
                                    size: 20,
                                  ),
                                ),
                              )
                            : devotionsNotifier.hasNextPage()
                                ? Container(
                                    padding: const EdgeInsets.all(10),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: () {
                                              devotionsNotifier.fetchNextPage();
                                            },
                                            child: const Text('Show More'),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                : Container();
                      }
                      
                      final devotionsFlat = devotions.requireValue
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
    Future<void> fetchDevoData() async {
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

        ref.read(loadedDevotionDataProvider.notifier).addDevotion(
              DevotionData(
                devotion: foundDevo,
                images: foundImages,
                sourceDocuments: foundSourceDocs,
                reactions: foundReactions,
                reactionCounts: foundReactionCounts,
              ),
            );
      });
    }

    return VisibilityDetector(
      key: ValueKey(devotion.id),
      onVisibilityChanged: (info) {
        if (info.visibleFraction == 1 &&
            !(ref
                    .read(loadedDevotionDataProvider)
                    .valueOrNull
                    ?.containsKey(devotion.id) ??
                false)) {
          fetchDevoData();
        }
      },
      child: ListTile(
        title: Text(DateFormat.yMMMd().format(devotion.date)),
        subtitle: Text(
          devotion.bibleReading.split(" - ").first,
        ),
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
