import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/hooks/use_chat.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/screens/chat/chat_modal.dart';
import 'package:revelationsai/src/services/chat.dart';
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

    final ValueNotifier<bool> loading = useState(false);
    final ValueNotifier<Chat?> chat = useState(null);

    final UseChatReturnObject chatObj = useChat(
      options: UseChatOptions(
        session: currentUser.requireValue!.session,
        chatId: chatId,
      ),
    );

    useEffect(() {
      loading.value = true;
      debugPrint("ChatScreen: $chatId");
      if (chatId != null) {
        Future.wait([
          ChatService.getChat(
            chatId: chatId!,
            session: currentUser.requireValue!.session,
          ).then((value) => chat.value = value),
          ChatService.getChatMessages(
            session: currentUser.requireValue!.session,
            chatId: chatId!,
          ).then((value) => chatObj.messages.value = value)
        ]).whenComplete(() => loading.value = false);
      } else {
        loading.value = false;
      }
      return () {};
    }, [chatId]);

    return Scaffold(
      appBar: AppBar(
        leading: null,
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
        title: loading.value
            ? const SpinKitThreeBounce(
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
              child: CircularProgressIndicator(
                color: RAIColors.primary,
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
                          ChatMessage message =
                              chatObj.messages.value.reversed.toList()[index];
                          return Message(
                              chatId: chatObj.chatId.value!, message: message);
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
                                SpinKitThreeBounce(
                                  color: RAIColors.primary,
                                  size: 20,
                                ),
                              ],
                            )
                          : Row(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                IconButton(
                                  onPressed: () {
                                    chatObj.reload();
                                  },
                                  icon: const FaIcon(
                                      FontAwesomeIcons.arrowRotateRight),
                                ),
                                IconButton(
                                  onPressed: () {
                                    chatObj.handleSubmit();
                                  },
                                  icon:
                                      const FaIcon(FontAwesomeIcons.paperPlane),
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
