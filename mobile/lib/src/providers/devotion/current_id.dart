import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_id.g.dart';

@riverpod
class CurrentDevotionId extends _$CurrentDevotionId {
  @override
  FutureOr<String?> build() async {
    if (state.valueOrNull != null) {
      ref.watch(devotionsProvider(state.valueOrNull!));
      ref.watch(devotionImagesProvider(state.valueOrNull!));
      ref.watch(devotionReactionsProvider(state.valueOrNull!));
      ref.watch(devotionReactionCountsProvider(state.valueOrNull!));
      ref.watch(devotionSourceDocumentsProvider(state.valueOrNull!));
    }

    return state.valueOrNull;
  }

  Future<void> updateId(String? id) async {
    if (id == null) {
      state = AsyncData((await ref.watch(devotionsPagesProvider.future)).firstOrNull?.firstOrNull?.id);
    } else {
      state = AsyncData(id);
    }
  }
}
