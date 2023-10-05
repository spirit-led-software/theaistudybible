import 'package:another_flushbar/flushbar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/hooks/use_chat.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/data.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/chat/data.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/screens/chat/chat_modal.dart';
import 'package:revelationsai/src/widgets/chat/message.dart';

class ChatScreen extends HookConsumerWidget {
  static const chatSuggestions = <String>{
    "Who is Jesus?",
    "Explain the gospel to me.",
    "What is the gospel?",
    "What is the Trinity?",
    "Is Jesus real?",
    "What is the Bible about?",
    "Why did Jesus have to die?",
    "Is God real?",
    "What does it mean to be saved?",
  };

  final String? chatId;

  const ChatScreen({
    super.key,
    this.chatId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final currentUserPreferences = ref.watch(currentUserPreferencesProvider);
    final loadedChats = ref.watch(loadedChatDataProvider);

    final isMounted = useIsMounted();
    final chat = useState<Chat?>(null);
    final loadingChat = useState(false);
    final showSuggestions = useState(false);
    final alert = useState<Alert?>(null);

    final shuffledSuggestions = <String>[...chatSuggestions];
    shuffledSuggestions.shuffle();

    final chatHook = useChat(
      options: UseChatOptions(
        session: currentUser.requireValue.session,
        chatId: chatId,
        hapticFeedback: currentUserPreferences.requireValue.hapticFeedback,
        onFinish: (_) {
          ref.read(currentUserProvider.notifier).decrementRemainingQueries();
        },
      ),
    );

    Future<void> fetchChatData(String id) async {
      await Future.wait([
        ref.read(chatsProvider(id).future),
        ref.read(currentChatMessagesProvider(id).future),
      ]).then((value) {
        final foundChat = value[0] as Chat;
        final foundMessages = value[1] as List<ChatMessage>;

        if (isMounted()) {
          chat.value = foundChat;
          chatHook.messages.value = foundMessages;
        }

        ref.read(loadedChatDataProvider.notifier).addChat(
              ChatData(
                chat: foundChat,
                messages: foundMessages,
              ),
            );
      });
    }

    useEffect(() {
      if (loadedChats.value?.containsKey(chatId) ?? false) {
        if (isMounted()) {
          final chatData = loadedChats.value![chatId];
          chat.value = chatData!.chat;
          chatHook.messages.value = chatData.messages;
        }
      } else {
        if (chatId != null) {
          loadingChat.value = true;
          fetchChatData(chatId!).whenComplete(() {
            if (isMounted()) loadingChat.value = false;
          });
        } else {
          chatHook.chatId.value = null;
          chatHook.messages.value = [];
        }
      }

      return () {};
    }, [chatId]);

    useEffect(() {
      if (chatHook.chatId.value != null) {
        if (loadedChats.value?.containsKey(chatHook.chatId.value) ?? false) {
          if (isMounted()) {
            final chatData = loadedChats.value![chatHook.chatId.value];
            chat.value = chatData!.chat;
          }
        } else {
          if (chatHook.chatId.value != null) {
            ref.read(chatsProvider(chatHook.chatId.value!).future).then(
              (value) {
                if (isMounted()) {
                  chat.value = value as Chat;
                }
              },
            );
          }
        }
      }

      return () {};
    }, [chatHook.chatId.value]);

    useEffect(() {
      if (chat.value != null) {
        Future(() {
          ref.read(currentChatIdProvider.notifier).update(chat.value!.id);
        });
      }
      return () {};
    }, [chat.value]);

    useEffect(() {
      if (chatHook.error.value != null) {
        if (isMounted()) {
          alert.value = Alert(
            type: AlertType.error,
            message: chatHook.error.value!
                .toString()
                .replaceFirst("Exception: ", ""),
          );
        }
      }
      return () {};
    }, [chatHook.error.value]);

    useEffect(() {
      if (alert.value != null) {
        Future(() {
          Flushbar(
            duration: const Duration(seconds: 5),
            message: alert.value!.message,
            backgroundColor: alert.value!.type == AlertType.error
                ? Colors.red
                : Colors.green,
            isDismissible: true,
            flushbarPosition: FlushbarPosition.TOP,
            flushbarStyle: FlushbarStyle.GROUNDED,
            padding: const EdgeInsets.all(30),
            dismissDirection: FlushbarDismissDirection.HORIZONTAL,
            animationDuration: const Duration(milliseconds: 200),
          ).show(context);
        }).whenComplete(() {
          if (isMounted()) alert.value = null;
        });
      }
      return () {};
    }, [alert.value]);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
        title: loadingChat.value
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("Loading Chat"),
                  SizedBox(
                    width: 15,
                  ),
                  SpinKitSpinningLines(
                    color: Colors.white,
                    size: 20,
                  )
                ],
              )
            : Text(
                chat.value?.name ?? "New Chat",
              ),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(chatsPagesProvider.notifier).refresh();
              showModalBottomSheet(
                elevation: 20,
                isScrollControlled: true,
                context: context,
                backgroundColor: Colors.white,
                builder: (_) => const FractionallySizedBox(
                  widthFactor: 1.0,
                  heightFactor: 0.90,
                  child: ChatModal(),
                ),
              );
            },
            icon: const FaIcon(FontAwesomeIcons.clock),
          ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.miniStartTop,
      floatingActionButton:
          currentUserPreferences.value?.chatSuggestions ?? true
              ? FloatingActionButton(
                  onPressed: () {
                    showSuggestions.value = !showSuggestions.value;
                  },
                  backgroundColor:
                      showSuggestions.value ? Colors.red : Colors.yellow,
                  foregroundColor: Colors.white,
                  child: FaIcon(
                    showSuggestions.value
                        ? FontAwesomeIcons.x
                        : FontAwesomeIcons.lightbulb,
                  ),
                )
              : null,
      body: loadingChat.value
          ? Center(
              child: SpinKitSpinningLines(
                color: RAIColors.primary,
                size: 40,
              ),
            )
          : Stack(
              children: [
                if (chatHook.messages.value.isEmpty) ...[
                  const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          "Not sure what to say?",
                        ),
                        SizedBox(
                          height: 10,
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text("Click the "),
                            SizedBox(
                              width: 5,
                            ),
                            FaIcon(
                              FontAwesomeIcons.lightbulb,
                              color: Colors.yellow,
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                ],
                Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      flex: 1,
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        reverse: true,
                        shrinkWrap: true,
                        itemCount: chatHook.messages.value.length + 1,
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            return const SizedBox(
                              height: 90,
                            );
                          }

                          final messagesReversed =
                              chatHook.messages.value.reversed.toList();
                          ChatMessage message = messagesReversed[index - 1];
                          ChatMessage? previousMessage =
                              index + 1 < messagesReversed.length
                                  ? messagesReversed[index]
                                  : null;
                          return Message(
                            key: ValueKey(message.id),
                            chatId: chatHook.chatId.value,
                            message: message,
                            previousMessage: previousMessage,
                            isCurrentResponse:
                                chatHook.currentResponseId.value == message.id,
                            isLoading: chatHook.loading.value,
                          );
                        },
                      ),
                    ),
                  ],
                ),
                Positioned(
                  bottom: 10,
                  left: 10,
                  right: 10,
                  child: Opacity(
                    opacity: 0.85,
                    child: TextField(
                      controller: chatHook.inputController,
                      focusNode: chatHook.inputFocusNode,
                      onSubmitted: (value) {
                        chatHook.handleSubmit();
                      },
                      onTapOutside: (event) {
                        chatHook.inputFocusNode.unfocus();
                      },
                      autocorrect: true,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        filled: true,
                        hintText: "Type a message",
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        suffixIcon: chatHook.loading.value
                            ? Row(
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  SpinKitWave(
                                    color: RAIColors.primary,
                                    size: 20,
                                  ),
                                ],
                              )
                            : Row(
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  IconButton(
                                    visualDensity: const VisualDensity(
                                      vertical: VisualDensity.minimumDensity,
                                      horizontal: VisualDensity.minimumDensity,
                                    ),
                                    onPressed: () {
                                      chatHook.reload();
                                    },
                                    icon: const FaIcon(
                                      FontAwesomeIcons.arrowRotateRight,
                                      size: 20,
                                    ),
                                  ),
                                  IconButton(
                                    visualDensity: const VisualDensity(
                                      vertical: VisualDensity.minimumDensity,
                                      horizontal: VisualDensity.minimumDensity,
                                    ),
                                    onPressed: () {
                                      chatHook.handleSubmit();
                                    },
                                    icon: const Icon(
                                      Icons.send,
                                      size: 20,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                ),
                if (showSuggestions.value)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      color: Colors.grey.shade200.withOpacity(0.8),
                      padding: const EdgeInsets.only(
                        top: 10,
                        bottom: 15,
                      ),
                      height: 75,
                      child: CustomScrollView(
                        scrollDirection: Axis.horizontal,
                        slivers: [
                          SliverPadding(
                            padding: const EdgeInsets.only(left: 70),
                            sliver: SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 5,
                                    ),
                                    child: ElevatedButton(
                                      onPressed: () {
                                        chatHook.append(
                                          ChatMessage(
                                            id: nanoid(),
                                            content: shuffledSuggestions[index],
                                            role: Role.user,
                                          ),
                                        );
                                        showSuggestions.value = false;
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: RAIColors.primary,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                      ),
                                      child: Text(
                                        shuffledSuggestions[index],
                                        style: const TextStyle(
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  );
                                },
                                childCount: shuffledSuggestions.length,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
