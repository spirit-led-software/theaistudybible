import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/services/ai_response.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'source_document.g.dart';

@riverpod
class AiResponseSourceDocuments extends _$AiResponseSourceDocuments {
  @override
  FutureOr<List<SourceDocument>> build(ChatMessage message, String? chatId) {
    final currentUser = ref.watch(currentUserProvider);

    if (message.uuid == null) {
      return AiResponseService.searchForAiResponses(
        query: Query(
          AND: [
            Query(
              OR: [
                Query(
                  eq: ColumnValue(
                    column: 'aiId',
                    value: message.id,
                  ),
                ),
                Query(
                  eq: ColumnValue(
                    column: 'id',
                    value: message.uuid,
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
        session: currentUser.requireValue.session,
      ).then((value) {
        return AiResponseService.getAiResponseSourceDocuments(
            id: value.entities.first.id,
            session: currentUser.requireValue.session);
      });
    } else {
      return AiResponseService.getAiResponseSourceDocuments(
        id: message.uuid!,
        session: currentUser.requireValue.session,
      );
    }
  }
}
