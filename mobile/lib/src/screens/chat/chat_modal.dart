import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/data.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/providers/chat/data.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/widgets/chat/create_dialog.dart';
import 'package:visibility_detector/visibility_detector.dart';

class ChatModal extends HookConsumerWidget {
  const ChatModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chats = ref.watch(chatsPagesProvider);
    final chatsNotifier = ref.watch(chatsPagesProvider.notifier);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
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
              color: RAIColors.primary,
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'All chats',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(
                    Icons.close,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          if (!chatsNotifier.isLoadingInitial())
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
          chatsNotifier.isLoadingInitial()
              ? Expanded(
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: RAIColors.primary,
                      size: 32,
                    ),
                  ),
                )
              : Expanded(
                  child: ListView.builder(
                    itemCount: chats.requireValue
                        .expand((element) => element)
                        .toList()
                        .length,
                    itemBuilder: (context, index) {
                      final chatsFlat = chats.requireValue
                          .expand((element) => element)
                          .toList();
                      final chat = chatsFlat[index];
                      return ChatListItem(
                        key: ValueKey(chat.id),
                        chat: chat,
                      );
                    },
                  ),
                ),
          chatsNotifier.isLoadingNextPage()
              ? Container(
                  padding: const EdgeInsets.all(10),
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: RAIColors.primary,
                      size: 20,
                    ),
                  ),
                )
              : chatsNotifier.hasNextPage()
                  ? Container(
                      padding: const EdgeInsets.all(10),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                chatsNotifier.fetchNextPage();
                              },
                              child: const Text('Show More'),
                            ),
                          ),
                        ],
                      ),
                    )
                  : Container(),
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
    Future<void> fetchChatData() async {
      await Future.wait([
        ref.read(chatsProvider(chat.id).future),
        ref.read(currentChatMessagesProvider(chat.id).future),
      ]).then((value) {
        final foundChat = value[0] as Chat;
        final foundMessages = value[1] as List<ChatMessage>;

        ref.read(loadedChatDataProvider.notifier).addChat(
              ChatData(
                chat: foundChat,
                messages: foundMessages,
              ),
            );
      });
    }

    return VisibilityDetector(
      key: ValueKey(chat.id),
      onVisibilityChanged: (info) {
        if (info.visibleFraction == 1 &&
            !(ref
                    .read(loadedChatDataProvider)
                    .valueOrNull
                    ?.containsKey(chat.id) ??
                false)) {
          fetchChatData();
        }
      },
      child: ListTile(
        title: Text(
          chat.name,
          softWrap: false,
          overflow: TextOverflow.fade,
        ),
        subtitle: Text(
          DateFormat.yMMMd().format(chat.createdAt),
        ),
        dense: true,
        onTap: () {
          context.go(
            '/chat/${chat.id}',
          );
          Navigator.of(context).pop();
        },
      ),
    );
  }
}
