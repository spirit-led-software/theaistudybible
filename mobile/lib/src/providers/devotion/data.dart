import 'package:flutter/material.dart';
import 'package:quiver/collection.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'data.g.dart';

@riverpod
class LoadedDevotionData extends _$LoadedDevotionData {
  static const int maxSize = 7;

  @override
  FutureOr<LruMap<String, DevotionData>> build() async {
    final map = state.value ?? LruMap(maximumSize: maxSize);
    final devotionsPages = ref.watch(devotionsPagesProvider);
    if (devotionsPages.hasValue) {
      int amountFetched = 0;
      outerLoop:
      for (final devotionsPage in devotionsPages.value!) {
        final futures = <Future>[];
        for (final devotion in devotionsPage) {
          if (amountFetched < maxSize) {
            futures.add(
              Future.wait([
                ref.watch(devotionsProvider(devotion.id).future),
                ref.watch(devotionImagesProvider(devotion.id).future),
                ref.watch(devotionSourceDocumentsProvider(devotion.id).future),
                ref.watch(devotionReactionsProvider(devotion.id).future),
                ref.watch(devotionReactionCountsProvider(devotion.id).future),
              ]).then((value) {
                map[devotion.id] = DevotionData(
                  devotion: value[0] as Devotion,
                  images: value[1] as List<DevotionImage>,
                  sourceDocuments: value[2] as List<SourceDocument>,
                  reactions: value[3] as List<DevotionReaction>,
                  reactionCounts: value[4] as Map<DevotionReactionType, int>,
                );
              }).catchError((error) {
                Future.wait([
                  ref.refresh(devotionsProvider(devotion.id).future),
                  ref.refresh(devotionImagesProvider(devotion.id).future),
                  ref.refresh(
                      devotionSourceDocumentsProvider(devotion.id).future),
                  ref.refresh(devotionReactionsProvider(devotion.id).future),
                  ref.refresh(
                      devotionReactionCountsProvider(devotion.id).future),
                ]).then((value) {
                  map[devotion.id] = DevotionData(
                    devotion: value[0] as Devotion,
                    images: value[1] as List<DevotionImage>,
                    sourceDocuments: value[2] as List<SourceDocument>,
                    reactions: value[3] as List<DevotionReaction>,
                    reactionCounts: value[4] as Map<DevotionReactionType, int>,
                  );
                }).catchError((error) {
                  debugPrint(
                      "Failed to load devotion data for ${devotion.id} after refresh: $error");
                });
              }),
            );
          } else {
            await Future.wait(futures);
            break outerLoop;
          }
        }
        await Future.wait(futures);
      }
    }

    return map;
  }

  void addDevotion(DevotionData devotionData) {
    final map = state.value ?? LruMap(maximumSize: maxSize);
    map[devotionData.devotion.id] = devotionData;
    state = AsyncData(map);
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
