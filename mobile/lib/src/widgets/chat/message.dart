import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/widgets/chat/sources.dart';

class Message extends HookConsumerWidget {
  final String? chatId;
  final ChatMessage message;
  final ChatMessage? previousMessage;
  final bool isLoading;
  final bool isLastMessage;

  const Message({
    Key? key,
    this.chatId,
    required this.message,
    this.previousMessage,
    this.isLoading = false,
    this.isLastMessage = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.only(
        top: 10,
        bottom: 10,
        left: 5,
        right: 5,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(0),
        side: BorderSide(
          color: Colors.grey.shade300,
        ),
      ),
      leading: CircleAvatar(
        backgroundColor: RAIColors.secondary,
        foregroundImage: message.role != Role.user
            ? null
            : currentUser.requireValue.image != null
                ? NetworkImage(
                    currentUser.requireValue.image!,
                  )
                : null,
        child: message.role == Role.user
            ? Text(currentUser.requireValue.name
                    ?.substring(0, 1)
                    .toUpperCase() ??
                currentUser.requireValue.email.substring(0, 1).toUpperCase())
            : const FaIcon(FontAwesomeIcons.cross),
      ),
      title: Text(
        message.content,
      ),
      subtitle: Container(
        padding: const EdgeInsets.only(
          top: 15,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              DateFormat()
                  .add_yMMMMd()
                  .addPattern(DateFormat.HOUR_MINUTE)
                  .format(message.createdAt ?? DateTime.now()),
              style: const TextStyle(fontSize: 10),
            ),
            if (message.role == Role.assistant &&
                !(isLoading && isLastMessage)) ...[
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
