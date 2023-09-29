import 'package:flutter/material.dart';
import 'package:quiver/collection.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'data.g.dart';

@riverpod
class LoadedDevotionData extends _$LoadedDevotionData {
  @override
  FutureOr<LruMap<String, DevotionData>> build() async {
    final map = state.value ?? LruMap(maximumSize: 10);
    final devotionsPages = ref.watch(devotionsPagesProvider);
    if (devotionsPages.hasValue) {
      final futures = <Future>[];
      for (final devotionsPage in devotionsPages.value!) {
        for (final devotion in devotionsPage) {
          futures.add(
            Future.wait([
              ref.watch(devotionImagesProvider(devotion.id).future),
              ref.watch(devotionSourceDocumentsProvider(devotion.id).future),
              ref.watch(devotionReactionsProvider(devotion.id).future),
              ref.watch(devotionReactionCountsProvider(devotion.id).future),
            ]).then((value) {
              map[devotion.id] = DevotionData(
                devotion: devotion,
                images: value[0] as List<DevotionImage>,
                sourceDocuments: value[1] as List<SourceDocument>,
                reactions: value[2] as List<DevotionReaction>,
                reactionCounts: value[3] as Map<DevotionReactionType, int>,
              );
            }).catchError((error) {
              debugPrint(
                  "Failed to load devotion data for ${devotion.id}: $error");
            }),
          );
        }
      }
      await Future.wait(futures);
    }

    return map;
  }

  void addDevotion(DevotionData devotionData) {
    final map = state.value ?? LruMap(maximumSize: 10);
    map[devotionData.devotion.id] = devotionData;
    state = AsyncData(map);
  }
}
