import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/devotion.dart';
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
        paginationOptions: PaginatedEntitiesRequestOptions(page: _page, limit: pageSize),
      ).then((value) {
        if (state.hasValue) {
          // replace pages previous content with new content
          return [
            ...state.value!.sublist(0, _page - 1),
            value.entities,
            if (state.value!.length > _page + 1) ...state.value!.sublist(_page + 1, state.value!.length),
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
      } else if (state.isLoading && _page == 1 && (!state.hasValue || state.value!.isEmpty)) {
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
      if (next.hasValue && previous?.value != next.value) {
        for (final devotionsPage in next.value!) {
          for (final devotion in devotionsPage) {
            await Future.wait([
              ref.read(devotionsProvider(devotion.id).future),
              ref.read(devotionSourceDocumentsProvider(devotion.id).future),
              ref.read(devotionImagesProvider(devotion.id).future),
              ref.read(devotionReactionsProvider(devotion.id).future),
              ref.read(devotionReactionCountsProvider(devotion.id).future),
            ]);
          }
        }

        final devotionsManager = ref.read(devotionManagerProvider).value;
        final devotionReactionsManager = ref.read(devotionReactionManagerProvider).value;
        final devotionsImagesManager = ref.read(devotionImageManagerProvider).value;
        final devotionsSourceDocumentsManager = ref.read(devotionSourceDocumentManagerProvider).value;

        final savedDevos = await devotionsManager?.getAllLocalDevotions() ?? [];
        final devotionsPagesFlat = next.value!.expand((element) => element);
        for (final savedDevo in savedDevos) {
          if (!devotionsPagesFlat.any((element) => element.id == savedDevo.id)) {
            await Future.wait([
              devotionsManager?.deleteLocalDevotion(savedDevo.id) ?? Future.value(),
              devotionsImagesManager?.deleteLocalDevotionImagesByDevotionId(savedDevo.id) ?? Future.value(),
              devotionsSourceDocumentsManager?.deleteLocalSourceDocumentsByDevotionId(savedDevo.id) ?? Future.value(),
              devotionReactionsManager?.deleteLocalDevotionReactionsByDevotionId(savedDevo.id) ?? Future.value(),
            ]);
          }
        }
      }
    });
  }
}
