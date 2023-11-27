import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/account/user_avatar.dart';
import 'package:revelationsai/src/widgets/branding/circular_logo.dart';
import 'package:revelationsai/src/widgets/chat/markdown.dart';
import 'package:revelationsai/src/widgets/chat/message_actions_dialog.dart';

class Message extends HookConsumerWidget {
  final String? chatId;
  final ChatMessage message;
  final ChatMessage? previousMessage;
  final bool isLoading;
  final bool isCurrentResponse;
  final bool isLastMessage;

  const Message({
    super.key,
    this.chatId,
    required this.message,
    this.previousMessage,
    this.isLoading = false,
    this.isCurrentResponse = false,
    this.isLastMessage = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hapticFeedback = ref.watch(currentUserPreferencesProvider).requireValue.hapticFeedback;

    final showMessageDialog = useCallback((context) {
      if (!isLoading) {
        if (hapticFeedback) HapticFeedback.mediumImpact();
        showDialog(
          context: context,
          builder: (context) {
            return MessageActionsDialog(
              message: message,
              previousMessage: previousMessage,
            );
          },
        );
      }
    }, [hapticFeedback, isLoading, message, previousMessage]);

    return Dismissible(
      key: ValueKey(message.uuid),
      confirmDismiss: (direction) async {
        return false;
      },
      direction: DismissDirection.endToStart,
      dismissThresholds: const {
        DismissDirection.endToStart: 0.95,
      },
      movementDuration: const Duration(milliseconds: 5),
      resizeDuration: const Duration(milliseconds: 5),
      background: Align(
        alignment: Alignment.centerRight,
        child: Container(
          margin: const EdgeInsets.only(
            right: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                DateFormat().add_yMd().format((message.createdAt ?? DateTime.now()).toLocal()),
              ),
              Text(DateFormat()
                  .addPattern(DateFormat.HOUR_MINUTE)
                  .format((message.createdAt ?? DateTime.now()).toLocal()))
            ],
          ),
        ),
      ),
      child: ListTile(
        visualDensity: RAIVisualDensity.tightest,
        dense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 10,
        ),
        title: Row(
          mainAxisAlignment: message.role == Role.user ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (message.role == Role.assistant) ...[
              const CircularLogo(
                radius: 15,
              ),
              const SizedBox(width: 5),
            ],
            Flexible(
              child: GestureDetector(
                onDoubleTap: () {
                  showMessageDialog(context);
                },
                onLongPress: () {
                  showMessageDialog(context);
                },
                child: Card(
                  color: message.role == Role.user
                      ? context.colorScheme.primary
                      : context.brightness == Brightness.light
                          ? Colors.grey.shade100
                          : Colors.grey.shade900,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(30),
                      topRight: const Radius.circular(30),
                      bottomLeft: message.role == Role.user ? const Radius.circular(30) : const Radius.circular(0),
                      bottomRight: message.role == Role.user ? const Radius.circular(0) : const Radius.circular(30),
                    ),
                  ),
                  elevation: 2,
                  margin: EdgeInsets.only(
                    bottom: 8,
                    left: message.role == Role.user ? 35 : 0,
                    right: message.role == Role.user ? 0 : 35,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: 15,
                      horizontal: 20,
                    ),
                    child: Column(
                      children: [
                        Text.rich(
                          TextSpan(
                            children: <InlineSpan>[
                              if (message.role == Role.assistant && message.content.isNotEmpty) ...[
                                WidgetSpan(
                                  child: MessageMarkdownBody(
                                    data: message.content.trim(),
                                  ),
                                )
                              ],
                              if (message.role == Role.user) ...[
                                TextSpan(
                                  text: message.content.trim(),
                                  style: context.textTheme.bodyMedium?.copyWith(
                                    color: message.role == Role.user
                                        ? context.colorScheme.onPrimary
                                        : context.colorScheme.onBackground,
                                  ),
                                ),
                              ],
                              if (isCurrentResponse) ...[
                                WidgetSpan(
                                  child: SizedBox(
                                    width: 20,
                                    height: 20,
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
                        if (isLastMessage && !isCurrentResponse && !isLoading) ...[
                          const SizedBox(height: 10),
                          Text(
                            "Double tap or hold to see options",
                            style: context.textTheme.bodySmall?.copyWith(
                              color: context.colorScheme.onBackground.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
            if (message.role == Role.user) ...[
              const SizedBox(width: 5),
              const UserAvatar(
                radius: 15,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
