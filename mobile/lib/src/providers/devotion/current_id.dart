import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:revelationsai/src/providers/devotion/single.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_id.g.dart';

@riverpod
class CurrentDevotionId extends _$CurrentDevotionId {
  @override
  FutureOr<String?> build() async {
    String id = state.valueOrNull ?? await ref.devotions.getLatest().then((value) => value.id);

    ref.watch(singleDevotionProvider(id));
    ref.watch(devotionImagesProvider(id));
    ref.watch(devotionReactionsProvider(id));
    ref.watch(devotionReactionCountsProvider(id));
    ref.watch(devotionSourceDocumentsProvider(id));

    return id;
  }

  Future<void> updateId(String? id) async {
    if (id == null) {
      state = AsyncData((await ref.watch(devotionsPagesProvider.future)).firstOrNull?.firstOrNull?.id);
    } else {
      state = AsyncData(id);
    }
  }
}
