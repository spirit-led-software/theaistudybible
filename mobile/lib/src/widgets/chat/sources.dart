import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/services/ai_response.dart';

class Sources extends HookConsumerWidget {
  final String chatId;
  final ChatMessage message;

  const Sources({Key? key, required this.chatId, required this.message})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<bool> showSources = useState(false);
    ValueNotifier<List<SourceDocument>> sources = useState([]);

    useEffect(
      () {
        loading.value = true;
        if (message.uuid == null) {
          AiResponseService.searchForAiResponses(
            query: Query(
              AND: [
                Query(
                  eq: ColumnValue(
                    column: 'aiId',
                    value: message.id,
                  ),
                ),
                Query(
                  eq: ColumnValue(
                    column: 'chatId',
                    value: chatId,
                  ),
                )
              ],
            ),
            session: currentUser.requireValue!.session,
          ).then((value) {
            AiResponseService.getAiResponseSourceDocuments(
                    id: value.entities.first.id,
                    session: currentUser.requireValue!.session)
                .then((value) {
              sources.value = value;
            }).whenComplete(() => loading.value = false);
          });
        } else {
          AiResponseService.getAiResponseSourceDocuments(
            id: message.uuid!,
            session: currentUser.requireValue!.session,
          ).then((value) {
            sources.value = value;
          }).whenComplete(() => loading.value = false);
        }
        return () {};
      },
      [
        currentUser,
        message,
      ],
    );

    return Flex(
      direction: Axis.vertical,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          child: Row(
            children: [
              Text(
                "Sources",
                style: TextStyle(
                  fontSize: 12,
                  color: RAIColors.secondary,
                ),
              ),
              const SizedBox(width: 5),
              showSources.value
                  ? const FaIcon(
                      FontAwesomeIcons.angleDown,
                      size: 8,
                    )
                  : const FaIcon(
                      FontAwesomeIcons.angleRight,
                      size: 8,
                    ),
            ],
          ),
          onTap: () => showSources.value = !showSources.value,
        ),
        if (showSources.value)
          ListView.builder(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            itemCount: sources.value.length,
            itemBuilder: (context, index) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: Text(
                  sources.value[index].metadata?['name'],
                  style: const TextStyle(fontSize: 8),
                ),
              );
            },
          ),
      ],
    );
  }
}
