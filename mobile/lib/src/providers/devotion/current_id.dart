import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/single.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_id.g.dart';

@riverpod
class CurrentDevotionId extends _$CurrentDevotionId {
  @override
  String? build() {
    if (stateOrNull != null) {
      ref.watch(singleDevotionProvider(stateOrNull!));
      ref.watch(devotionImagesProvider(stateOrNull!));
      ref.watch(devotionReactionsProvider(stateOrNull!));
      ref.watch(devotionReactionCountsProvider(stateOrNull!));
      ref.watch(devotionSourceDocumentsProvider(stateOrNull!));
    }

    return stateOrNull;
  }

  Future<void> updateId(String? id) async {
    state = id;
  }
}
