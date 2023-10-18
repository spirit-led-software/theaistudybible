import 'package:another_flushbar/flushbar.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
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
import 'package:revelationsai/src/widgets/chat/create_dialog.dart';
import 'package:revelationsai/src/widgets/chat/edit_dialog.dart';
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
    final updatingChat = useState(false);
    final showSuggestions = useState(false);
    final alert = useState<Alert?>(null);
    final shuffledSuggestions = useRef(<String>[...chatSuggestions]..shuffle());

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
      if (chatId != null) {
        if (loadedChats.value?.containsKey(chatId) ?? false) {
          if (isMounted()) {
            final chatData = loadedChats.value![chatId];
            chat.value = chatData!.chat;
            chatHook.messages.value = chatData.messages;
          }
        } else {
          loadingChat.value = true;
          fetchChatData(chatId!).whenComplete(() {
            if (isMounted()) loadingChat.value = false;
          });
        }
      } else {
        if (isMounted()) {
          chat.value = null;
          chatHook.chatId.value = null;
          chatHook.messages.value = [];
        }
      }

      return () {};
    }, [chatId]);

    useEffect(() {
      if (chatHook.chatId.value != null && chatHook.chatId.value != chatId) {
        if (loadedChats.value?.containsKey(chatHook.chatId.value) ?? false) {
          if (isMounted()) {
            final chatData = loadedChats.value![chatHook.chatId.value];
            chat.value = chatData!.chat;
            chatHook.messages.value = chatData.messages;
          }
        } else {
          ref.read(chatsProvider(chatHook.chatId.value!).future).then(
            (value) {
              if (isMounted()) {
                chat.value = value;
              }
            },
          );
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

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        floatingActionButtonLocation: FloatingActionButtonLocation.miniEndTop,
        floatingActionButton: Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: RAIColors.secondary,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.shade300,
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: IntrinsicHeight(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (currentUserPreferences.value?.chatSuggestions ?? true) ...[
                  IconButton(
                    onPressed: () {
                      showSuggestions.value = !showSuggestions.value;
                    },
                    icon: FaIcon(
                      showSuggestions.value
                          ? FontAwesomeIcons.xmark
                          : FontAwesomeIcons.lightbulb,
                      size: 32,
                      color: Colors.white,
                    ),
                  ),
                  const VerticalDivider(
                    color: Colors.white,
                    thickness: 1,
                    width: 10,
                  )
                ],
                PopupMenuButton(
                  offset: const Offset(0, 55),
                  color: RAIColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  itemBuilder: (context) {
                    return [
                      PopupMenuItem(
                        enabled: false,
                        child: Text(
                          chat.value?.name ?? "New Chat",
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () {
                          String? id = chat.value?.id ?? chatId;
                          if (id != null) {
                            ref.read(chatsProvider(id).notifier).refresh();
                            ref
                                .read(currentChatMessagesProvider(id).notifier)
                                .refresh();
                            updatingChat.value = true;
                            fetchChatData(id).whenComplete(() {
                              if (isMounted()) updatingChat.value = false;
                            });
                          }
                        },
                        child: const Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.arrowsRotate,
                              color: Colors.white,
                            ),
                            SizedBox(
                              width: 10,
                            ),
                            Text(
                              "Refresh",
                              style: TextStyle(color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () {
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
                        child: const Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.clock,
                              color: Colors.white,
                            ),
                            SizedBox(
                              width: 10,
                            ),
                            Text(
                              "History",
                              style: TextStyle(color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () async {
                          showDialog(
                            context: context,
                            builder: (context) {
                              return const CreateDialog();
                            },
                          );
                        },
                        child: const Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.plus,
                              color: Colors.white,
                            ),
                            SizedBox(
                              width: 10,
                            ),
                            Text(
                              "New Chat",
                              style: TextStyle(color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () {
                          String? id = chat.value?.id ?? chatId;
                          if (id != null) {
                            showDialog(
                              context: context,
                              builder: (context) {
                                return EditDialog(
                                  id: id,
                                  name: chat.value?.name ?? "",
                                );
                              },
                            ).whenComplete(() {
                              ref.read(chatsProvider(id).notifier).refresh();
                              updatingChat.value = true;
                              ref.read(chatsProvider(id).future).then(
                                (value) {
                                  if (isMounted()) {
                                    chat.value = value;
                                  }
                                },
                              ).whenComplete(() {
                                if (isMounted()) updatingChat.value = false;
                              });
                            });
                          }
                        },
                        child: const Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.penToSquare,
                              color: Colors.white,
                            ),
                            SizedBox(
                              width: 10,
                            ),
                            Text(
                              "Edit Chat",
                              style: TextStyle(color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () {
                          String? id = chat.value?.id ?? chatId;
                          if (id != null) {
                            ref
                                .read(chatsPagesProvider.notifier)
                                .deleteChat(id);
                            ref
                                .read(currentChatIdProvider.notifier)
                                .update(null);
                            context.go("/chat");
                          }
                        },
                        child: const Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.delete,
                              color: Colors.red,
                            ),
                            SizedBox(
                              width: 10,
                            ),
                            Text(
                              "Delete Chat",
                              style: TextStyle(color: Colors.red),
                            ),
                          ],
                        ),
                      ),
                    ];
                  },
                  icon: const Icon(
                    Icons.more_vert,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        body: loadingChat.value
            ? Center(
                child: SpinKitSpinningLines(
                  color: RAIColors.primary,
                  size: 40,
                ),
              )
            : Stack(
                children: [
                  if (chatHook.messages.value.isEmpty &&
                      (currentUserPreferences.value?.chatSuggestions ??
                          true)) ...[
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            "Not sure what to say?",
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(
                            height: 10,
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text(
                                "Tap the ",
                                style: TextStyle(fontSize: 20),
                              ),
                              const SizedBox(
                                width: 5,
                              ),
                              FaIcon(
                                FontAwesomeIcons.lightbulb,
                                color: RAIColors.secondary,
                                size: 32,
                              ),
                            ],
                          ),
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
                                  chatHook.currentResponseId.value ==
                                      message.id,
                              isLoading: chatHook.loading.value,
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: showSuggestions.value
                            ? Colors.grey.shade200.withOpacity(0.9)
                            : Colors.transparent,
                      ),
                      padding: EdgeInsets.only(
                        top: showSuggestions.value ? 10 : 0,
                        bottom: 10,
                      ),
                      child: Column(
                        children: [
                          if (showSuggestions.value) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                vertical: 10,
                                horizontal: 0,
                              ),
                              height: 75,
                              child: CustomScrollView(
                                scrollDirection: Axis.horizontal,
                                slivers: [
                                  SliverPadding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                    ),
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
                                                    content: shuffledSuggestions
                                                        .value[index],
                                                    role: Role.user,
                                                  ),
                                                );
                                                showSuggestions.value = false;
                                              },
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor:
                                                    RAIColors.primary,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                              ),
                                              child: Text(
                                                shuffledSuggestions
                                                    .value[index],
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                          );
                                        },
                                        childCount:
                                            shuffledSuggestions.value.length,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
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
                                textCapitalization:
                                    TextCapitalization.sentences,
                                decoration: InputDecoration(
                                  filled: true,
                                  hintText: "Type a message",
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide:
                                        BorderSide(color: Colors.grey.shade300),
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
                                          crossAxisAlignment:
                                              CrossAxisAlignment.center,
                                          children: [
                                            IconButton(
                                              visualDensity:
                                                  const VisualDensity(
                                                vertical: VisualDensity
                                                    .minimumDensity,
                                                horizontal: VisualDensity
                                                    .minimumDensity,
                                              ),
                                              onPressed: () {
                                                chatHook.reload();
                                              },
                                              icon: const FaIcon(
                                                FontAwesomeIcons
                                                    .arrowRotateRight,
                                                size: 20,
                                              ),
                                            ),
                                            IconButton(
                                              visualDensity:
                                                  const VisualDensity(
                                                vertical: VisualDensity
                                                    .minimumDensity,
                                                horizontal: VisualDensity
                                                    .minimumDensity,
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
                        ],
                      ),
                    ),
                  ),
                  if (updatingChat.value) ...[
                    Positioned.fill(
                      child: Container(
                        color: Colors.black.withOpacity(0.3),
                        child: const Center(
                          child: SpinKitSpinningLines(
                            color: Colors.white,
                            size: 60,
                          ),
                        ),
                      ),
                    ),
                  ]
                ],
              ),
      ),
    );
  }
}
