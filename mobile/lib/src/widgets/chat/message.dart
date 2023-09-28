import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/widgets/chat/sources.dart';
import 'package:revelationsai/src/widgets/network_image.dart';

class Message extends HookConsumerWidget {
  final String? chatId;
  final ChatMessage message;
  final ChatMessage? previousMessage;
  final bool isLoading;
  final bool isCurrentResponse;

  const Message({
    Key? key,
    this.chatId,
    required this.message,
    this.previousMessage,
    this.isLoading = false,
    this.isCurrentResponse = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.only(
        top: 10,
        bottom: 10,
        left: 10,
        right: 5,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(0),
        side: BorderSide(
          color: Colors.grey.shade300,
        ),
      ),
      title: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: RAIColors.secondary,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(100),
              child: message.role == Role.user
                  ? RAINetworkImage(
                      imageUrl: currentUser.requireValue.image,
                      fallbackText: currentUser.requireValue.name
                              ?.substring(0, 1)
                              .toUpperCase() ??
                          currentUser.requireValue.email
                              .substring(0, 1)
                              .toUpperCase(),
                    )
                  : Image.asset("assets/icons/icon.png"),
            ),
          ),
          const SizedBox(
            width: 15,
          ),
          Flexible(
            child: Text(
              message.content + (isCurrentResponse ? "|" : ""),
            ),
          ),
        ],
      ),
      subtitle: Container(
        padding: const EdgeInsets.only(
          top: 15,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              DateFormat()
                  .add_yMMMMd()
                  .addPattern(DateFormat.HOUR_MINUTE)
                  .format(message.createdAt ?? DateTime.now()),
              style: const TextStyle(fontSize: 10),
            ),
            if (message.role == Role.assistant && !isCurrentResponse) ...[
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Flexible(
                    fit: FlexFit.loose,
                    child: Sources(
                      chatId: chatId,
                      message: message,
                      previousMessage: previousMessage,
                      isLoading: isLoading,
                      isCurrentResponse: isCurrentResponse,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
