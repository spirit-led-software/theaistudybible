import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/hooks/use_chat.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/screens/chat/chat_modal.dart';
import 'package:revelationsai/src/widgets/chat/message.dart';

class ChatScreen extends HookConsumerWidget {
  final String? chatId;

  const ChatScreen({
    super.key,
    this.chatId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    final UseChatReturnObject chatObj = useChat(
      options: UseChatOptions(
        session: currentUser.requireValue.session,
        chatId: chatId,
      ),
    );

    final chat = useState<Chat?>(null);
    final messages = useState<List<ChatMessage>>([]);
    final loading = useState(false);

    useEffect(() {
      if (chatId != null) {
        loading.value = true;

        final chatFuture = ref
            .read(currentChatProvider(chatId!).future)
            .then((value) => chat.value = value);

        final messagesFuture = ref
            .read(currentChatMessagesProvider(chatId!).future)
            .then((value) => messages.value = value);

        Future.wait([
          chatFuture,
          messagesFuture,
        ]).whenComplete(() => loading.value = false);
      }
      return () {};
    }, [chatId]);

    useEffect(() {
      if (messages.value.isNotEmpty) {
        chatObj.messages.value = messages.value;
      }
      return () {};
    }, [
      messages.value,
    ]);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
        title: loading.value
            ? const SpinKitFoldingCube(
                color: Colors.white,
                size: 20,
              )
            : Text(
                chat.value?.name ?? "New Chat",
              ),
        actions: [
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
      body: loading.value
          ? Center(
              child: SpinKitFoldingCube(
                color: RAIColors.primary,
                size: 32,
              ),
            )
          : Stack(
              children: [
                Flex(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  direction: Axis.vertical,
                  children: [
                    Expanded(
                      child: ListView.builder(
                        reverse: true,
                        shrinkWrap: true,
                        scrollDirection: Axis.vertical,
                        itemCount: chatObj.messages.value.length,
                        itemBuilder: (context, index) {
                          final messagesReversed =
                              chatObj.messages.value.reversed.toList();
                          ChatMessage message = messagesReversed[index];
                          ChatMessage? previousMessage =
                              index + 1 < messagesReversed.length
                                  ? messagesReversed[index + 1]
                                  : null;
                          return Message(
                            chatId: chatObj.chatId.value,
                            message: message,
                            previousMessage: previousMessage,
                            isLastMessage: index == 0,
                            isLoading: chatObj.loading.value,
                          );
                        },
                      ),
                    ),
                    const SizedBox(
                      height: 90,
                    )
                  ],
                ),
                Positioned(
                  bottom: 10,
                  left: 10,
                  right: 10,
                  child: TextField(
                    controller: chatObj.inputController,
                    onSubmitted: (value) {
                      chatObj.handleSubmit();
                    },
                    decoration: InputDecoration(
                      hintText: "Type a message",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      suffixIcon: chatObj.loading.value
                          ? Row(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                SpinKitFoldingCube(
                                  color: RAIColors.primary,
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
              ],
            ),
    );
  }
}
