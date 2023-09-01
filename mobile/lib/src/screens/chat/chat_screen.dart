import 'dart:developer' as developer;

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/chat/chat.dart';
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
    ValueNotifier<bool> loading = useState(true);
    ValueNotifier<Chat?> chat = useState(null);

    useEffect(() {
      developer.log("ChatScreen: $chatId");
      if (chatId == null) {
        loading.value = false;
      } else {
        getChat(
          chatId: chatId!,
          session: currentUser.requireValue!.session,
        ).then((value) {
          chat.value = value;
        }).catchError((error) {
          developer.log("Error: $error");
          context.go("/chat");
        }).whenComplete(() {
          loading.value = false;
        });
      }
      return null;
    }, [chatId]);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: RAIColors.primary,
        title: Text(
          chat.value?.name ?? "New Chat",
          style: const TextStyle(color: Colors.white),
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
