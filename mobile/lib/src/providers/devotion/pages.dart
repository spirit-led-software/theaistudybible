import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/data.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'pages.g.dart';

@Riverpod(keepAlive: true)
class DevotionsPages extends _$DevotionsPages {
  static const int pageSize = 7;

  int _page = 1;
  bool _isLoadingInitial = true;
  final bool _isLoading = false;
  bool _isLoadingNextPage = false;

  @override
  FutureOr<List<List<Devotion>>> build() async {
    _loadingLogic();
    _persistenceLogic();

    try {
      return await DevotionService.getDevotions(
        paginationOptions:
            PaginatedEntitiesRequestOptions(page: _page, limit: pageSize),
      ).then((value) {
        if (state.hasValue) {
          // replace pages previous content with new content
          return [
            ...state.value!.sublist(0, _page - 1),
            value.entities,
            if (state.value!.length > _page + 1)
              ...state.value!.sublist(_page + 1, state.value!.length),
          ];
        } else {
          return [
            value.entities,
          ];
        }
      });
    } catch (error) {
      debugPrint("Failed to fetch devotions: $error");
      rethrow;
    }
  }

  bool hasNextPage() {
    return (state.value?.last.length ?? 0) >= 7;
  }

  void fetchNextPage() {
    _page++;
    _isLoadingNextPage = true;
    refresh();
  }

  void reset() {
    _page = 1;
    refresh();
  }

  void refresh() {
    ref.invalidateSelf();
  }

  bool isLoadingInitial() {
    return _isLoadingInitial;
  }

  bool isLoading() {
    return _isLoading;
  }

  bool isLoadingNextPage() {
    return _isLoadingNextPage;
  }

  void _loadingLogic() {
    ref.listenSelf((_, __) {
      if (!state.isLoading) {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      } else if (state.isLoading &&
          _page == 1 &&
          (!state.hasValue || state.value!.isEmpty)) {
        _isLoadingInitial = true;
      } else if (state.isLoading && _page > 1) {
        _isLoadingNextPage = true;
      } else {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      }
    });
  }

  void _persistenceLogic() {
    ref.listenSelf((previous, next) async {
      final devotionDataManager = ref.read(devotionDataManagerProvider).value;
      if (next.hasValue && previous?.value != next.value) {
        for (final devotionsPage in next.value!) {
          for (final devotion in devotionsPage) {
            return await Future.wait([
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
              final foundReactionCounts =
                  value[4] as Map<DevotionReactionType, int>;
              devotionDataManager?.addDevotion(
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
            }).catchError((error) {
              debugPrint("Failed to refresh devotion: $error");
            });
          }
        }

        final savedDevos = await devotionDataManager?.getAllDevotions();

        if (savedDevos != null) {
          final devotionsPagesFlat = next.value!.expand((element) => element);
          for (final savedDevo in savedDevos) {
            if (!devotionsPagesFlat
                .any((element) => element.id == savedDevo.id)) {
              devotionDataManager?.deleteDevotion(savedDevo.id);
            }
          }
        }
      }
    });
  }
}
