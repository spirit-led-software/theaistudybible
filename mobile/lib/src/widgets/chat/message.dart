import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/account/user_avatar.dart';
import 'package:revelationsai/src/widgets/branding/circular_logo.dart';
import 'package:revelationsai/src/widgets/chat/sources.dart';

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
    final currentUser = ref.watch(currentUserProvider).requireValue;
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.only(
        top: 10,
        bottom: 10,
        left: 25,
        right: 20,
      ),
      shape: Border(
        bottom: BorderSide(
          color: context.colorScheme.onBackground.withOpacity(0.3),
        ),
      ),
      title: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (message.role == Role.user) const UserAvatar() else const CircularLogo(),
              const SizedBox(
                width: 20,
              ),
              Flexible(
                child: Text(
                  message.role == Role.user ? currentUser.name ?? currentUser.email : 'RevelationsAI',
                  style: context.textTheme.bodyLarge?.copyWith(
                    color: context.colorScheme.onBackground.withOpacity(0.75),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(
            height: 25,
          ),
          Row(
            children: [
              Flexible(
                child: SelectableText.rich(
                  TextSpan(
                    children: <InlineSpan>[
                      TextSpan(
                        text: message.content.trim(),
                      ),
                      if (isCurrentResponse) ...[
                        WidgetSpan(
                          child: Container(
                            width: 20,
                            height: 20,
                            margin: const EdgeInsets.only(
                              left: 5,
                            ),
                            child: SpinKitSpinningLines(
                              color: context.colorScheme.onBackground,
                              size: 20,
                            ),
                          ),
                        ),
                      ]
                    ],
                  ),
                  textAlign: TextAlign.start,
                  style: context.textTheme.bodyMedium,
                ),
              ),
            ],
          )
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
                  .format((message.createdAt ?? DateTime.now()).toLocal()),
              style: context.textTheme.bodySmall?.copyWith(
                color: context.colorScheme.onBackground.withOpacity(0.6),
              ),
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
                      isChatLoading: isLoading,
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
