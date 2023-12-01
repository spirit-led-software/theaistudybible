import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/user/generated_image.dart';
import 'package:revelationsai/src/providers/user/generated_image/repositories.dart';
import 'package:revelationsai/src/providers/user/generated_image/single.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'pages.g.dart';

@Riverpod(keepAlive: true)
class UserGeneratedImagesPages extends _$UserGeneratedImagesPages {
  static const int pageSize = 15;

  int _page = 1;
  bool _isLoadingInitial = true;
  bool _isLoadingNextPage = false;

  @override
  FutureOr<List<List<UserGeneratedImage>>> build() async {
    _loadingLogic();
    _persistenceLogic();

    return await ref.userGeneratedImages
        .getPage(PaginatedEntitiesRequestOptions(page: _page, limit: pageSize))
        .then((value) {
      if (state.hasValue) {
        // replace pages previous content with new content
        return [
          ...state.value!.sublist(0, _page - 1),
          value,
          if (state.value!.length > _page + 1) ...state.value!.sublist(_page + 1, state.value!.length),
        ];
      } else {
        return [
          value,
        ];
      }
    });
  }

  bool hasNextPage() {
    return (state.value?.last.length ?? 0) >= pageSize;
  }

  Future<void> fetchNextPage() async {
    _page++;
    ref.invalidateSelf();
    await future;
  }

  Future<void> reset() async {
    _page = 1;
    state = AsyncData([state.value?.first ?? []]);
    ref.invalidateSelf();
    await future;
  }

  Future<void> deleteImage(String userGeneratedImageId) async {
    final previousState = state;
    state = AsyncValue.data(state.value
            ?.map(
              (page) => page.where((userGeneratedImage) => userGeneratedImage.id != userGeneratedImageId).toList(),
            )
            .toList() ??
        []);
    return await ref.userGeneratedImages.deleteRemote(userGeneratedImageId).catchError((error) {
      debugPrint("Failed to delete userGeneratedImage: $error");
      state = previousState;
      throw error;
    });
  }

  Future<List<List<UserGeneratedImage>>> refresh() async {
    final futures = <Future<List<UserGeneratedImage>>>[];
    for (int i = 1; i <= _page; i++) {
      futures.add(ref.userGeneratedImages.refreshPage(PaginatedEntitiesRequestOptions(page: i, limit: pageSize)));
    }
    return await Future.wait(futures).then((value) async {
      state = AsyncData(value);
      return value;
    });
  }

  bool isLoadingInitial() {
    return _isLoadingInitial;
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
        for (final userGeneratedImagesPage in next.value!) {
          for (final userGeneratedImage in userGeneratedImagesPage) {
            Future.wait([
              ref.read(singleUserGeneratedImageProvider(userGeneratedImage.id).future),
            ]);
          }
        }

        final savedUserGeneratedImages = await ref.userGeneratedImages.getAllLocal();
        final userGeneratedImagesPagesFlat = next.value!.expand((element) => element);
        for (final savedUserGeneratedImage in savedUserGeneratedImages) {
          if (!userGeneratedImagesPagesFlat.any((element) => element.id == savedUserGeneratedImage.id)) {
            ref.userGeneratedImages.deleteLocal(savedUserGeneratedImage.id);
          }
        }
      }
    });
  }
}
