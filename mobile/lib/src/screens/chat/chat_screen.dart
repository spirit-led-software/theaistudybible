import 'package:another_flushbar/flushbar.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/hooks/use_chat.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/providers/chat/single.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/screens/chat/chat_modal.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/utils/in_app_review.dart';
import 'package:revelationsai/src/widgets/chat/create_dialog.dart';
import 'package:revelationsai/src/widgets/chat/message.dart';
import 'package:revelationsai/src/widgets/chat/rename_dialog.dart';

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

  final String? initChatId;

  const ChatScreen({
    super.key,
    this.initChatId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider).requireValue;
    final currentUserPreferences = ref.watch(currentUserPreferencesProvider).requireValue;

    final isMounted = useIsMounted();
    final scrollController = useScrollController();
    final scrollableEndIsInView = useState(true);
    final isLoadingChat = useState(false);
    final isRefreshingChat = useState(false);
    final showSuggestions = useState(false);
    final alert = useState<Alert?>(null);
    final shuffledSuggestions = useRef(<String>[...chatSuggestions]..shuffle());

    final chat = useState<Chat?>(null);
    final chatHook = useChat(
      options: UseChatOptions(
        session: currentUser.session,
        hapticFeedback: currentUserPreferences.hapticFeedback,
        onFinish: (_) {
          inAppReviewLogic();
        },
      ),
    );

    useEffect(() {
      chatHook.chatId.value = initChatId;
      return () {};
    }, [initChatId]);

    useEffect(() {
      if (chatHook.chatId.value != null) {
        ref.read(singleChatProvider(chatHook.chatId.value).future).then((value) {
          if (isMounted()) chat.value = value;
        }).catchError((error) {
          debugPrint("Failed to get chat: $error");
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                "Failed to get chat: $error",
                style: TextStyle(
                  color: context.colorScheme.onError,
                ),
              ),
              backgroundColor: context.colorScheme.error,
            ),
          );
          ref.read(currentChatIdProvider.notifier).update(null);
          context.go("/chat");
        });

        if (!chatHook.loading.value) {
          isLoadingChat.value = true;
          ref.read(chatMessagesProvider(chatHook.chatId.value).future).then((value) {
            if (isMounted()) chatHook.messages.value = value;
          }).catchError((error) {
            debugPrint("Failed to get chat messages: $error");
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  "Failed to get chat messages: $error",
                  style: TextStyle(
                    color: context.colorScheme.onError,
                  ),
                ),
                backgroundColor: context.colorScheme.error,
              ),
            );
          }).whenComplete(() {
            if (isMounted()) isLoadingChat.value = false;
          });
        }
      } else {
        if (isMounted()) {
          chat.value = null;
          chatHook.chatId.value = null;
          chatHook.messages.value = [];
        }
      }
      Future(() {
        ref.read(currentChatIdProvider.notifier).update(chatHook.chatId.value);
      });
      return () {};
    }, [chatHook.chatId.value]);

    useEffect(() {
      if (!chatHook.loading.value && chatHook.currentResponseId.value == null) {
        debugPrint("Refreshing messages since chat is idle.");
        ref.read(chatMessagesProvider(chatHook.chatId.value).notifier).refresh();
      }
      return () {};
    }, [chatHook.loading.value, chatHook.currentResponseId.value]);

    useEffect(() {
      if (chatHook.error.value != null) {
        if (isMounted()) {
          alert.value = Alert(
            type: AlertType.error,
            message: chatHook.error.value!.toString().replaceFirst("Exception: ", ""),
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
            backgroundColor: alert.value!.type == AlertType.error ? Colors.red : Colors.green,
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

    useEffect(() {
      if (scrollController.hasClients) {
        scrollController.addListener(() {
          if (scrollController.position.outOfRange) {
            return;
          }

          if (scrollController.offset <= scrollController.position.minScrollExtent) {
            if (isMounted()) scrollableEndIsInView.value = true;
          } else {
            if (isMounted()) scrollableEndIsInView.value = false;
          }
        });
      }

      return () {};
    }, [scrollController.hasClients]);

    debugPrint(
        "ChatScreen: initChatId: $initChatId, chatHook.chatId.value: ${chatHook.chatId.value}, chatHook.messages.value.length: ${chatHook.messages.value.length}");

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: context.isDarkMode ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Scaffold(
        floatingActionButtonLocation: FloatingActionButtonLocation.miniEndTop,
        floatingActionButton: Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: context.secondaryColor,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: context.theme.shadowColor.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: IntrinsicHeight(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (currentUserPreferences.chatSuggestions) ...[
                  IconButton(
                    color: context.colorScheme.onSecondary,
                    onPressed: () {
                      showSuggestions.value = !showSuggestions.value;
                    },
                    icon: FaIcon(
                      showSuggestions.value ? FontAwesomeIcons.xmark : FontAwesomeIcons.lightbulb,
                      size: 32,
                    ),
                  ),
                  VerticalDivider(
                    color: context.colorScheme.onSecondary,
                    thickness: 1,
                    width: 10,
                  )
                ],
                PopupMenuButton(
                  offset: const Offset(0, 55),
                  color: context.primaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  itemBuilder: (popupMenuContext) {
                    return [
                      PopupMenuItem(
                        enabled: false,
                        child: Text(
                          chat.value?.name ?? "New Chat",
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: popupMenuContext.colorScheme.onPrimary,
                          ),
                        ),
                      ),
                      PopupMenuItem(
                        enabled: false,
                        height: double.minPositive,
                        child: Divider(
                          color: popupMenuContext.colorScheme.onPrimary,
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () async {
                          if (chatHook.chatId.value != null) {
                            isRefreshingChat.value = true;
                            return await Future.wait([
                              ref.read(singleChatProvider(chatHook.chatId.value).notifier).refresh(),
                              ref.read(chatMessagesProvider(chatHook.chatId.value).notifier).refresh(),
                            ]).then((value) {
                              final foundChat = value[0] as Chat;
                              final foundMessages = value[1] as List<ChatMessage>;
                              if (isMounted()) {
                                chat.value = foundChat;
                                chatHook.messages.value = foundMessages;
                              }
                            }).catchError(
                              (error) {
                                debugPrint("Failed to refresh chat: $error $error");
                              },
                            ).whenComplete(() {
                              if (isMounted()) isRefreshingChat.value = false;
                            });
                          }
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.arrowsRotate,
                              color: popupMenuContext.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "Refresh",
                              style: TextStyle(
                                color: popupMenuContext.colorScheme.onPrimary,
                              ),
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
                            context: popupMenuContext,
                            builder: (_) => const FractionallySizedBox(
                              widthFactor: 1.0,
                              heightFactor: 0.90,
                              child: ChatModal(),
                            ),
                          );
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.clock,
                              color: popupMenuContext.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "History",
                              style: TextStyle(
                                color: popupMenuContext.colorScheme.onPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () async {
                          showDialog(
                            context: popupMenuContext,
                            builder: (context) {
                              return const CreateDialog();
                            },
                          );
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.plus,
                              color: popupMenuContext.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "New Chat",
                              style: TextStyle(
                                color: popupMenuContext.colorScheme.onPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () {
                          if (chatHook.chatId.value != null) {
                            showDialog(
                              context: popupMenuContext,
                              builder: (context) {
                                return RenameDialog(
                                  id: chatHook.chatId.value!,
                                  name: chat.value!.name,
                                );
                              },
                            ).then((_) async {
                              await ref
                                  .read(singleChatProvider(chatHook.chatId.value).notifier)
                                  .refresh()
                                  .then((value) {
                                chat.value = value;
                              });
                            });
                          }
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.penToSquare,
                              color: popupMenuContext.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "Rename Chat",
                              style: TextStyle(
                                color: popupMenuContext.colorScheme.onPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        onTap: () async {
                          if (chatHook.chatId.value != null) {
                            isRefreshingChat.value = true;
                            await ref.read(singleChatProvider(chatHook.chatId.value).notifier).deleteChat().then(
                              (value) {
                                if (isMounted()) {
                                  chat.value = null;
                                  chatHook.chatId.value = null;
                                  chatHook.messages.value = [];
                                }
                                ref.read(currentChatIdProvider.notifier).update(null);
                                popupMenuContext.go("/chat");
                              },
                            ).whenComplete(() {
                              if (isMounted()) isRefreshingChat.value = false;
                            });
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
                  icon: Icon(
                    Icons.more_vert,
                    color: context.colorScheme.onSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
        body: isLoadingChat.value
            ? Center(
                child: SpinKitSpinningLines(
                  color: context.secondaryColor,
                  size: 40,
                ),
              )
            : Stack(
                children: [
                  if (chatHook.messages.value.isEmpty && currentUserPreferences.chatSuggestions) ...[
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
                                color: context.secondaryColor,
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
                          controller: scrollController,
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

                            final messagesReversed = chatHook.messages.value.reversed.toList();
                            ChatMessage message = messagesReversed[index - 1];
                            ChatMessage? previousMessage =
                                index + 1 <= messagesReversed.length ? messagesReversed[index] : null;
                            return Message(
                              key: ValueKey(message.id),
                              chatId: chatHook.chatId.value,
                              message: message,
                              previousMessage: previousMessage,
                              isCurrentResponse: chatHook.currentResponseId.value == message.id,
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
                    child: Column(
                      children: [
                        if (!scrollableEndIsInView.value) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 5),
                            child: IconButton(
                              onPressed: () {
                                scrollController.animateTo(
                                  0,
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeInOut,
                                );
                              },
                              style: IconButton.styleFrom(
                                shape: const CircleBorder(),
                                padding: const EdgeInsets.all(5),
                                backgroundColor: context.secondaryColor,
                                foregroundColor: context.colorScheme.onSecondary,
                                shadowColor: context.theme.shadowColor,
                                elevation: 5,
                              ),
                              icon: const Icon(
                                Icons.arrow_downward,
                                size: 32,
                              ),
                            ),
                          ),
                        ],
                        Container(
                          decoration: BoxDecoration(
                            color: showSuggestions.value
                                ? context.colorScheme.background.withOpacity(0.8)
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
                                                        content: shuffledSuggestions.value[index],
                                                        role: Role.user,
                                                      ),
                                                    );
                                                    showSuggestions.value = false;
                                                  },
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: context.colorScheme.primary,
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius: BorderRadius.circular(10),
                                                    ),
                                                  ),
                                                  child: Text(
                                                    shuffledSuggestions.value[index],
                                                    style: TextStyle(
                                                      color: context.colorScheme.onPrimary,
                                                    ),
                                                  ),
                                                ),
                                              );
                                            },
                                            childCount: shuffledSuggestions.value.length,
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
                                  opacity: 0.9,
                                  child: TextField(
                                    minLines: 1,
                                    maxLines: 5,
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
                                      fillColor: context.isDarkMode ? context.primaryColor : null,
                                      hintText: "Type a message",
                                      suffixIcon: chatHook.loading.value
                                          ? Row(
                                              mainAxisSize: MainAxisSize.min,
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                SpinKitWave(
                                                  color: context.colorScheme.onBackground,
                                                  size: 20,
                                                ),
                                              ],
                                            )
                                          : Row(
                                              mainAxisSize: MainAxisSize.min,
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isRefreshingChat.value) ...[
                    Positioned.fill(
                      child: Container(
                        color: Colors.black.withOpacity(0.1),
                        child: Center(
                          child: SpinKitSpinningLines(
                            color: context.colorScheme.onBackground,
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
