import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/chat/create_dialog.dart';
import 'package:visibility_detector/visibility_detector.dart';

class ChatModal extends HookConsumerWidget {
  const ChatModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatsPages = ref.watch(chatsPagesProvider);
    final chatsPagesNotifier = ref.watch(chatsPagesProvider.notifier);

    return Container(
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        color: context.colorScheme.background,
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(
              top: 10,
              bottom: 10,
              left: 30,
            ),
            decoration: ShapeDecoration(
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              color: context.primaryColor,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'All chats',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: context.colorScheme.onPrimary,
                    ),
                  ),
                ),
                IconButton(
                  color: context.colorScheme.onPrimary,
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(
                    Icons.close,
                  ),
                ),
              ],
            ),
          ),
          if (!chatsPagesNotifier.isLoadingInitial())
            Container(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) {
                            return const CreateDialog();
                          },
                        );
                      },
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text('New Chat'),
                          SizedBox(
                            width: 10,
                          ),
                          Icon(Icons.add),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          chatsPagesNotifier.isLoadingInitial()
              ? Expanded(
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: context.colorScheme.onBackground,
                      size: 32,
                    ),
                  ),
                )
              : Expanded(
                  child: RefreshIndicator(
                    onRefresh: () async {
                      return await ref.refresh(chatsPagesProvider.future);
                    },
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: chatsPages.requireValue.expand((element) => element).toList().length + 1,
                      itemBuilder: (listItemContext, index) {
                        if (index == chatsPages.requireValue.expand((element) => element).toList().length) {
                          return chatsPagesNotifier.isLoadingNextPage()
                              ? Container(
                                  padding: const EdgeInsets.all(10),
                                  child: Center(
                                    child: SpinKitSpinningLines(
                                      color: listItemContext.colorScheme.onBackground,
                                      size: 20,
                                    ),
                                  ),
                                )
                              : chatsPagesNotifier.hasNextPage()
                                  ? Container(
                                      padding: const EdgeInsets.all(10),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: ElevatedButton(
                                              onPressed: () {
                                                chatsPagesNotifier.fetchNextPage();
                                              },
                                              child: const Text('Show More'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  : Container();
                        }

                        final chatsFlat = chatsPages.requireValue.expand((element) => element).toList();
                        final chat = chatsFlat[index];
                        return ChatListItem(
                          key: ValueKey(chat.id),
                          chat: chat,
                        );
                      },
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

class ChatListItem extends HookConsumerWidget {
  final Chat chat;

  const ChatListItem({Key? key, required this.chat}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentChatId = ref.watch(currentChatIdProvider);

    return VisibilityDetector(
      key: ValueKey(chat.id),
      onVisibilityChanged: (info) async {
        await Future.wait([
          ref.read(chatsProvider(chat.id).future),
          ref.read(chatMessagesProvider(chat.id).future),
        ]);
      },
      child: Container(
        decoration: BoxDecoration(
          color: currentChatId == chat.id ? context.secondaryColor.withOpacity(0.2) : Colors.transparent,
        ),
        child: ListTile(
          title: Text(
            chat.name,
            softWrap: false,
            overflow: TextOverflow.fade,
          ),
          subtitle: Text(
            DateFormat.yMMMd().format(chat.createdAt),
          ),
          trailing: currentChatId == chat.id
              ? Icon(
                  Icons.check,
                  color: context.secondaryColor,
                )
              : null,
          dense: true,
          onTap: () {
            context.go(
              '/chat/${chat.id}',
            );
            Navigator.of(context).pop();
          },
        ),
      ),
    );
  }
}
