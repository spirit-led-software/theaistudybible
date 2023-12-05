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
import 'package:revelationsai/src/providers/chat/single.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/advertisement.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/utils/in_app_review.dart';
import 'package:revelationsai/src/widgets/chat/action_menu_button.dart';
import 'package:revelationsai/src/widgets/chat/chat_suggestions.dart';
import 'package:revelationsai/src/widgets/chat/message.dart';

class ChatScreen extends HookConsumerWidget {
  final String? initChatId;

  const ChatScreen({
    super.key,
    this.initChatId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    debugPrint("Rebuilding ChatScreen");

    final currentUser = ref.watch(currentUserProvider).requireValue;
    final currentUserPreferences = ref.watch(currentUserPreferencesProvider).requireValue;

    final isMounted = useIsMounted();
    final scrollableEndIsInView = useState(true);
    final isLoadingChat = useState(false);
    final isRefreshingChat = useState(false);
    final alert = useState<Alert?>(null);
    final input = useState("");

    final scrollController = useScrollController();

    final chat = useState<Chat?>(null);
    final chatHook = useChat(
      options: UseChatOptions(
        session: currentUser.session,
        hapticFeedback: currentUserPreferences.hapticFeedback,
        onFinish: (_) async {
          await Future.delayed(const Duration(seconds: 2), () async {
            final showedReview = await inAppReviewLogic();
            if (!showedReview) {
              await showAdvertisementLogic(ref);
            }
          });
        },
      ),
    );

    final scrollToEnd = useCallback(() {
      if (scrollController.hasClients) {
        scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      }
    }, [
      scrollController.hasClients,
    ]);

    final submit = useCallback(() {
      if (currentUser.remainingQueries < 1) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "You have no remaining queries. Please upgrade your account.",
              style: context.textTheme.bodyMedium?.copyWith(
                color: context.colorScheme.onError,
              ),
            ),
            backgroundColor: context.colorScheme.error,
          ),
        );
        context.go("/upgrade");
        return;
      }
      scrollToEnd();
      chatHook.handleSubmit();
    }, [context, currentUser, chatHook.handleSubmit, scrollToEnd]);

    final reload = useCallback(() {
      if (currentUser.remainingQueries < 1) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "You have no remaining queries. Please upgrade your account.",
              style: context.textTheme.bodyMedium?.copyWith(
                color: context.colorScheme.onError,
              ),
            ),
            backgroundColor: context.colorScheme.error,
          ),
        );
        context.go("/upgrade");
        return;
      }
      scrollToEnd();
      chatHook.reload();
    }, [context, currentUser, chatHook.reload, scrollToEnd]);

    final refreshChatData = useCallback(() async {
      await Future.wait([
        ref.read(singleChatProvider(chatHook.chatId.value).notifier).refresh(),
        ref.read(chatMessagesProvider(chatHook.chatId.value).notifier).refresh(),
      ]).then((value) {
        if (isMounted()) {
          chat.value = value[0] as Chat?;
          if (!chatHook.loading.value) {
            chatHook.messages.value = value[1] as List<ChatMessage>;
          }
        }
      });
    }, [ref, chatHook.chatId.value, chatHook.loading.value, isMounted]);

    useEffect(() {
      chatHook.chatId.value = initChatId;
      return () {};
    }, [initChatId]);

    useEffect(() {
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
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
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
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              backgroundColor: context.colorScheme.error,
            ),
          );
        }).whenComplete(() async {
          if (isMounted()) {
            isLoadingChat.value = false;
            await Future(() => refreshChatData());
          }
        });
      }
      Future(() {
        ref.read(currentChatIdProvider.notifier).update(chatHook.chatId.value);
      });
      return () {};
    }, [chatHook.chatId.value]);

    useEffect(() {
      debugPrint(
          "ChatScreen: chatHook.loading.value: ${chatHook.loading.value} chatHook.currentResponseId.value: ${chatHook.currentResponseId.value} chatHook.error.value: ${chatHook.error.value}");
      if (!chatHook.loading.value && chatHook.currentResponseId.value == null && chatHook.error.value == null) {
        debugPrint("Refreshing chat data since chat is idle.");
        Future(() => refreshChatData());
      }
      return () {};
    }, [chatHook.loading.value, chatHook.currentResponseId.value, chatHook.error.value]);

    useEffect(() {
      debugPrint("ChatScreen: chatHook.error.value: ${chatHook.error.value}");
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
      debugPrint("ChatScreen: alert.value: ${alert.value}");
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
            dismissDirection: FlushbarDismissDirection.VERTICAL,
            animationDuration: const Duration(milliseconds: 200),
          ).show(context);
        }).whenComplete(() {
          if (isMounted()) alert.value = null;
        });
      }
      return () {};
    }, [alert.value]);

    useEffect(() {
      debugPrint("ChatScreen: scrollController.hasClients: ${scrollController.hasClients}");
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
      } else {
        if (isMounted()) scrollableEndIsInView.value = true;
      }
      return () {};
    }, [scrollController.hasClients]);

    useEffect(() {
      chatHook.inputController.addListener(() {
        if (isMounted()) input.value = chatHook.inputController.text;
      });
      return () {};
    }, [chatHook.inputController]);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: context.isDarkMode ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Scaffold(
        floatingActionButtonLocation: FloatingActionButtonLocation.miniStartTop,
        floatingActionButton: ChatActionMenuButton(
          chatHook: chatHook,
          chat: chat,
          isMounted: isMounted,
          isRefreshingChat: isRefreshingChat,
          refreshChatData: refreshChatData,
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
                  Positioned.fill(
                    child: ListView.builder(
                      controller: scrollController,
                      physics: const AlwaysScrollableScrollPhysics(
                        parent: BouncingScrollPhysics(
                          parent: RangeMaintainingScrollPhysics(),
                        ),
                      ),
                      shrinkWrap: true,
                      reverse: true,
                      itemCount: chatHook.messages.value.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return const SizedBox(
                            height: 65,
                          );
                        }

                        final messagesReversed = chatHook.messages.value.reversed.toList();
                        ChatMessage message = messagesReversed[index - 1];

                        return Message(
                          chatId: chatHook.chatId.value,
                          message: message,
                          isCurrentResponse: chatHook.currentResponseId.value == message.id,
                          isLoading: chatHook.loading.value,
                          isLastMessage: index == chatHook.messages.value.length - 1,
                        );
                      },
                    ),
                  ),
                  if (chatHook.messages.value.isEmpty && currentUserPreferences.chatSuggestions) ...[
                    Center(
                      child: ChatSuggestions(
                        onTap: (suggestionString) {
                          if (currentUserPreferences.hapticFeedback) HapticFeedback.mediumImpact();

                          chatHook.append(
                            ChatMessage(
                              id: nanoid(),
                              content: suggestionString,
                              createdAt: DateTime.now(),
                              role: Role.user,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
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
                                if (currentUserPreferences.hapticFeedback) HapticFeedback.mediumImpact();
                                scrollToEnd();
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
                          padding: const EdgeInsets.only(
                            bottom: 10,
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                child: Opacity(
                                  opacity: 0.95,
                                  child: TextField(
                                    minLines: 1,
                                    maxLines: 4,
                                    controller: chatHook.inputController,
                                    focusNode: chatHook.inputFocusNode,
                                    onSubmitted: (_) {
                                      submit();
                                    },
                                    onTapOutside: (event) {
                                      chatHook.inputFocusNode.unfocus();
                                    },
                                    autocorrect: true,
                                    textCapitalization: TextCapitalization.sentences,
                                    decoration: InputDecoration(
                                      contentPadding: const EdgeInsets.symmetric(
                                        vertical: 10,
                                        horizontal: 25,
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: context.colorScheme.onBackground.withOpacity(0.2),
                                        ),
                                        borderRadius: BorderRadius.circular(40),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: context.colorScheme.onBackground.withOpacity(0.2),
                                        ),
                                        borderRadius: BorderRadius.circular(40),
                                      ),
                                      filled: true,
                                      fillColor: context.colorScheme.background,
                                      hintText: "Type a message",
                                      prefixIconConstraints: const BoxConstraints(
                                        minWidth: 0,
                                        minHeight: 0,
                                      ),
                                      prefixIcon: IconButton(
                                        visualDensity: VisualDensity.compact,
                                        style: IconButton.styleFrom(
                                          shape: CircleBorder(
                                            side: BorderSide(
                                              color: context.colorScheme.onBackground.withOpacity(0.2),
                                            ),
                                          ),
                                          backgroundColor: currentUser.remainingQueries <= 5
                                              ? context.colorScheme.error.withOpacity(0.2)
                                              : null,
                                        ),
                                        onPressed: () {
                                          context.go("/upgrade");
                                        },
                                        icon: Text(
                                          currentUser.remainingQueries > 10
                                              ? ">10"
                                              : currentUser.remainingQueries.toString(),
                                        ),
                                      ),
                                      suffixIcon: chatHook.loading.value
                                          ? SizedBox(
                                              width: 30,
                                              height: 30,
                                              child: SpinKitWave(
                                                color: context.colorScheme.onBackground,
                                                size: 15,
                                              ),
                                            )
                                          : input.value.isEmpty
                                              ? chatHook.messages.value.isNotEmpty
                                                  ? IconButton(
                                                      visualDensity: VisualDensity.compact,
                                                      onPressed: reload,
                                                      icon: const FaIcon(
                                                        FontAwesomeIcons.arrowRotateRight,
                                                        size: 18,
                                                      ),
                                                    )
                                                  : const SizedBox()
                                              : IconButton(
                                                  visualDensity: VisualDensity.compact,
                                                  onPressed: submit,
                                                  icon: const Icon(
                                                    FontAwesomeIcons.arrowUp,
                                                    size: 18,
                                                  ),
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
                        color: Colors.black.withOpacity(0.4),
                        child: Center(
                          child: SpinKitSpinningLines(
                            color: context.colorScheme.secondary,
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
