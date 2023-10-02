import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'pages.g.dart';

@riverpod
class DevotionsPages extends _$DevotionsPages {
  int _page = 1;
  bool _isLoadingInitial = true;
  final bool _isLoading = false;
  bool _isLoadingNextPage = false;

  @override
  FutureOr<List<List<Devotion>>> build() async {
    ref.listenSelf((_, __) {
      if (!state.isLoading) {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      } else if (state.isLoading &&
          _page == 1 &&
          !state.hasValue &&
          state.value!.isEmpty) {
        _isLoadingInitial = true;
      } else if (state.isLoading && _page > 1) {
        _isLoadingNextPage = true;
      } else {
        _isLoadingInitial = false;
        _isLoadingNextPage = false;
      }
    });

    try {
      return await DevotionService.getDevotions(
        paginationOptions:
            PaginatedEntitiesRequestOptions(page: _page, limit: 7),
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
}
