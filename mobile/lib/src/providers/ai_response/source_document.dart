import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/ai_response.dart';
import 'package:revelationsai/src/utils/filter_source_document.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'source_document.g.dart';

@riverpod
class AiResponseSourceDocuments extends _$AiResponseSourceDocuments {
  @override
  FutureOr<List<SourceDocument>> build(
    String? messageId,
    String? messageUuid,
    String? chatId,
  ) async {
    final currentUser = ref.watch(currentUserProvider).requireValue;

    if (messageUuid == null) {
      return AiResponseService.searchForAiResponses(
        query: Query(
          AND: [
            Query(
              OR: [
                Query(
                  eq: ColumnValue(
                    column: 'aiId',
                    value: messageId,
                  ),
                ),
                Query(
                  eq: ColumnValue(
                    column: 'id',
                    value: messageUuid,
                  ),
                ),
              ],
            ),
            Query(
              eq: ColumnValue(
                column: 'chatId',
                value: chatId,
              ),
            )
          ],
        ),
        session: currentUser.session,
      ).then((value) {
        return AiResponseService.getAiResponseSourceDocuments(
          id: value.entities.first.id,
          session: currentUser.session,
        ).then((value) => filterSourceDocuments(value));
      });
    } else {
      return AiResponseService.getAiResponseSourceDocuments(
        id: messageUuid,
        session: currentUser.session,
      ).then((value) => filterSourceDocuments(value));
    }
  }

  void refresh() {
    ref.invalidateSelf();
  }
}
