import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/hooks/use_chat.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/screens/chat/chat_modal.dart';
import 'package:revelationsai/src/widgets/chat/message.dart';
import 'package:url_launcher/url_launcher.dart';

class ChatScreen extends HookConsumerWidget {
  final String? chatId;

  const ChatScreen({
    super.key,
    this.chatId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final isMounted = useIsMounted();

    final UseChatReturnObject chatObj = useChat(
      options: UseChatOptions(
        session: currentUser.requireValue.session,
        chatId: chatId,
      ),
    );

    final chat = useState<Chat?>(null);
    final messages = useState<List<ChatMessage>>([]);
    final loadingChat = useState(false);

    final alert = useState<Alert?>(null);

    useEffect(() {
      if (chatId != null) {
        loadingChat.value = true;

        final chatFuture =
            ref.read(currentChatProvider(chatId!).future).then((value) {
          if (isMounted()) chat.value = value;
        });

        final messagesFuture =
            ref.read(currentChatMessagesProvider(chatId!).future).then((value) {
          if (isMounted()) messages.value = value;
        });

        Future.wait([
          chatFuture,
          messagesFuture,
        ]).whenComplete(() {
          if (isMounted()) loadingChat.value = false;
        });
      }
      return () {};
    }, [chatId]);

    useEffect(() {
      chatObj.messages.value = messages.value;
      return () {};
    }, [
      messages.value,
    ]);

    useEffect(() {
      if (chatObj.error.value != null) {
        alert.value = Alert(
          type: AlertType.error,
          message: chatObj.error.value!.toString(),
        );
      }
      return () {};
    }, [chatObj.error.value]);

    useEffect(() {
      if (alert.value != null) {
        Future.delayed(const Duration(seconds: 8)).then((value) {
          alert.value = null;
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
          TextButton(
              style: TextButton.styleFrom(
                visualDensity: RAIVisualDensity.tightest,
                backgroundColor: RAIColors.secondary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.only(
                  left: 10,
                  right: 10,
                  top: 20,
                  bottom: 20,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: () async {
                await launchUrl(
                  Uri.parse("https://revelationsai.com/upgrade"),
                  mode: LaunchMode.externalApplication,
                  webViewConfiguration: WebViewConfiguration(
                    headers: {
                      'rai-session': currentUser.requireValue.session,
                    },
                  ),
                );
              },
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    "${currentUser.requireValue.remainingQueries}/${currentUser.requireValue.maxQueries}",
                    style: const TextStyle(
                      fontSize: 12,
                    ),
                  ),
                  const Text(
                    "Upgrade",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              )),
          IconButton(
            onPressed: () {
              showModalBottomSheet(
                elevation: 20,
                isScrollControlled: true,
                context: context,
                backgroundColor: Colors.white,
                builder: (_) => const FractionallySizedBox(
                  heightFactor: 0.90,
                  child: ChatModal(),
                ),
              );
            },
            icon: const Icon(Icons.more_vert),
          ),
        ],
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
                Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: ListView.builder(
                        reverse: true,
                        shrinkWrap: true,
                        scrollDirection: Axis.vertical,
                        itemCount: chatObj.messages.value.length + 1,
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            return const SizedBox(
                              height: 90,
                            );
                          }

                          final messagesReversed =
                              chatObj.messages.value.reversed.toList();
                          ChatMessage message = messagesReversed[index - 1];
                          ChatMessage? previousMessage =
                              index + 1 < messagesReversed.length
                                  ? messagesReversed[index]
                                  : null;
                          return Message(
                            chatId: chatObj.chatId.value,
                            message: message,
                            previousMessage: previousMessage,
                            isCurrentResponse:
                                chatObj.currentResponseId.value == message.id,
                            isLoading: chatObj.loading.value,
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
                      controller: chatObj.inputController,
                      focusNode: chatObj.inputFocusNode,
                      onSubmitted: (value) {
                        chatObj.handleSubmit();
                      },
                      onTapOutside: (event) {
                        chatObj.inputFocusNode.unfocus();
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
                        suffixIcon: chatObj.loading.value
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
                                      chatObj.reload();
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
                                      chatObj.handleSubmit();
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
                if (alert.value != null)
                  Positioned(
                    top: 5,
                    left: 10,
                    right: 10,
                    child: Container(
                      decoration: BoxDecoration(
                        color: alert.value!.type == AlertType.error
                            ? Colors.red
                            : Colors.green,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.all(10),
                      child: Flex(
                        mainAxisAlignment: MainAxisAlignment.center,
                        direction: Axis.horizontal,
                        children: [
                          Flexible(
                            flex: 1,
                            fit: FlexFit.loose,
                            child: Text(
                              alert.value!.message,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
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
