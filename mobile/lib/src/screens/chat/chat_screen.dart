import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/services/chat.dart';

class ChatScreen extends HookConsumerWidget {
  final String? chatId;

  const ChatScreen({
    super.key,
    this.chatId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<Chat?> chat = useState(null);

    useEffect(() {
      loading.value = true;
      debugPrint("ChatScreen: $chatId");
      if (chatId != null) {
        ChatService.getChat(
          chatId: chatId!,
          session: currentUser.requireValue!.session,
        ).then((value) {
          chat.value = value;
        }).catchError((error) {
          debugPrint("Error: $error");
          context.go("/chat");
        }).whenComplete(() {
          loading.value = false;
        });
      } else {
        loading.value = false;
      }
      return () {};
    }, [chatId]);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
        title: Text(
          chat.value?.name ?? "New Chat",
        ),
      ),
      body: loading.value
          ? Center(
              child: CircularProgressIndicator(
                color: RAIColors.primary,
              ),
            )
          : const Center(
              child: Text("Chat"),
            ),
    );
  }
}
