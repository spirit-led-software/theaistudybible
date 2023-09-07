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
  bool _isLoading = false;
  bool _isLoadingNextPage = false;

  @override
  FutureOr<List<List<Devotion>>> build() async {
    try {
      _isLoading = true;
      final devotions = await DevotionService.getDevotions(
        paginationOptions:
            PaginatedEntitiesRequestOptions(page: _page, limit: 7),
      );
      return [
        if (state.hasValue) ...state.value!,
        devotions.entities,
      ];
    } catch (error) {
      debugPrint("Failed to fetch devotions: $error");
      rethrow;
    } finally {
      _isLoadingInitial = false;
      _isLoading = false;
      _isLoadingNextPage = false;
    }
  }

  bool hasNextPage() {
    return (state.value?.last.length ?? 0) >= 7;
  }

  void fetchNextPage() {
    _page++;
    _isLoadingNextPage = true;
    ref.invalidateSelf();
  }

  void reset() {
    _page = 1;
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
