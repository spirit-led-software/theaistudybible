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
    if (state.value == null) {
      return (await ref.watch(devotionsPagesProvider.future)).firstOrNull?.firstOrNull?.id;
    }

    ref.watch(devotionsProvider(state.value!));
    ref.watch(devotionImagesProvider(state.value!));
    ref.watch(devotionReactionsProvider(state.value!));
    ref.watch(devotionReactionCountsProvider(state.value!));
    ref.watch(devotionSourceDocumentsProvider(state.value!));

    return state.value;
  }

  Future<void> updateId(String? id) async {
    if (id == null) {
      state = AsyncData((await ref.watch(devotionsPagesProvider.future)).firstOrNull?.firstOrNull?.id);
    } else {
      state = AsyncData(id);
    }
  }
}
