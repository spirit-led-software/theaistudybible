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
    final isLoadingChat = useState(false);
    final isRefreshingChat = useState(false);
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
          inAppReviewLogic();
        },
      ),
    );

    final chat = ref.watch(chatsProvider(chatHook.chatId.value ?? chatId));

    Future<void> fetchChatData(String id) async {
      await Future.wait([
        ref.read(chatsProvider(id).future),
        ref.read(currentChatMessagesProvider(id).future),
      ]).then((value) {
        final foundChat = value[0] as Chat;
        final foundMessages = value[1] as List<ChatMessage>;

        if (isMounted()) {
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
            chatHook.messages.value = chatData!.messages;
          }
        } else {
          isLoadingChat.value = true;
          fetchChatData(chatId!).whenComplete(() {
            if (isMounted()) isLoadingChat.value = false;
          });
        }
        if (isMounted()) chatHook.chatId.value = chatId;
      } else {
        if (isMounted()) {
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
            chatHook.messages.value = chatData!.messages;
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

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: context.brightness == Brightness.light
          ? SystemUiOverlayStyle.dark
          : SystemUiOverlayStyle.light,
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
                if (currentUserPreferences.value?.chatSuggestions ?? true) ...[
                  IconButton(
                    color: context.colorScheme.onSecondary,
                    onPressed: () {
                      showSuggestions.value = !showSuggestions.value;
                    },
                    icon: FaIcon(
                      showSuggestions.value
                          ? FontAwesomeIcons.xmark
                          : FontAwesomeIcons.lightbulb,
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
                  itemBuilder: (context) {
                    return [
                      PopupMenuItem(
                        enabled: false,
                        child: Text(
                          chat.valueOrNull?.name ?? "New Chat",
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: context.colorScheme.onPrimary,
                          ),
                        ),
                      ),
                      PopupMenuItem(
                        enabled: false,
                        height: double.minPositive,
                        child: Divider(
                          color: context.colorScheme.onPrimary,
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
                            isRefreshingChat.value = true;
                            fetchChatData(id).whenComplete(() {
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
                              color: context.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "Refresh",
                              style: TextStyle(
                                color: context.colorScheme.onPrimary,
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
                            context: context,
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
                              color: context.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "History",
                              style: TextStyle(
                                color: context.colorScheme.onPrimary,
                              ),
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
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.plus,
                              color: context.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "New Chat",
                              style: TextStyle(
                                color: context.colorScheme.onPrimary,
                              ),
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
                                return RenameDialog(
                                  id: id,
                                  name: chat.value?.name ?? "",
                                );
                              },
                            );
                          }
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.penToSquare,
                              color: context.colorScheme.onPrimary,
                            ),
                            const SizedBox(
                              width: 10,
                            ),
                            Text(
                              "Rename Chat",
                              style: TextStyle(
                                color: context.colorScheme.onPrimary,
                              ),
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
                                index + 1 <= messagesReversed.length
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
                                                    content: shuffledSuggestions
                                                        .value[index],
                                                    role: Role.user,
                                                  ),
                                                );
                                                showSuggestions.value = false;
                                              },
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor:
                                                    context.colorScheme.primary,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                              ),
                                              child: Text(
                                                shuffledSuggestions
                                                    .value[index],
                                                style: TextStyle(
                                                  color: context
                                                      .colorScheme.onPrimary,
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
                                textCapitalization:
                                    TextCapitalization.sentences,
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: context.isDarkMode
                                      ? context.primaryColor
                                      : null,
                                  hintText: "Type a message",
                                  suffixIcon: chatHook.loading.value
                                      ? Row(
                                          mainAxisSize: MainAxisSize.min,
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            SpinKitWave(
                                              color: context
                                                  .colorScheme.onBackground,
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
