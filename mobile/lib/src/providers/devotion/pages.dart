import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:revelationsai/src/providers/devotion/single.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
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

    return await ref.devotions.getPage(PaginatedEntitiesRequestOptions(page: _page, limit: pageSize)).then((value) {
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

  Future<List<List<Devotion>>> refresh() async {
    final futures = <Future<List<Devotion>>>[];
    for (int i = 1; i <= _page; i++) {
      futures.add(ref.devotions.refreshPage(PaginatedEntitiesRequestOptions(page: i, limit: pageSize)));
    }
    return await Future.wait(futures).then((value) async {
      state = AsyncData(value);
      return value;
    });
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
              ref.read(singleDevotionProvider(devotion.id).future),
              ref.read(devotionSourceDocumentsProvider(devotion.id).future),
              ref.read(devotionImagesProvider(devotion.id).future),
              ref.read(devotionReactionsProvider(devotion.id).future),
              ref.read(devotionReactionCountsProvider(devotion.id).future),
            ]);
          }
        }

        final savedDevos = await ref.devotions.getAllLocal();
        final devotionsPagesFlat = next.value!.expand((element) => element);
        for (final savedDevo in savedDevos) {
          if (!devotionsPagesFlat.any((element) => element.id == savedDevo.id)) {
            await Future.wait([
              ref.devotions.deleteLocal(savedDevo.id),
              ref.devotionImages.deleteLocalByDevotionId(savedDevo.id),
              ref.devotionSourceDocuments.deleteLocalByDevotionId(savedDevo.id),
              ref.devotionReactions.deleteLocalByDevotionId(savedDevo.id),
            ]);
          }
        }
      }
    });
  }
}
