import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/account/user_avatar.dart';
import 'package:revelationsai/src/widgets/branding/circular_logo.dart';
import 'package:revelationsai/src/widgets/chat/message_actions_dialog.dart';

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
    final hapticFeedback = ref.watch(currentUserPreferencesProvider).requireValue.hapticFeedback;

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
                radius: 18,
              ),
              const SizedBox(width: 10),
            ],
            Flexible(
              child: GestureDetector(
                onLongPress: () {
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
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: message.role == Role.user
                        ? context.brightness == Brightness.light
                            ? context.colorScheme.primary
                            : context.colorScheme.secondary
                        : context.brightness == Brightness.light
                            ? Colors.grey.shade300
                            : context.colorScheme.primary,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: message.role == Role.user ? const Radius.circular(20) : const Radius.circular(0),
                      bottomRight: message.role == Role.user ? const Radius.circular(0) : const Radius.circular(20),
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(
                    vertical: 10,
                    horizontal: 15,
                  ),
                  margin: EdgeInsets.only(
                    bottom: 15,
                    left: message.role == Role.user ? 40 : 0,
                    right: message.role == Role.user ? 0 : 40,
                  ),
                  child: Column(
                    children: [
                      Text.rich(
                        TextSpan(
                          children: <InlineSpan>[
                            TextSpan(
                              text: message.content.trim(),
                              style: context.textTheme.bodyMedium?.copyWith(
                                color: message.role == Role.user
                                    ? context.colorScheme.onPrimary
                                    : context.colorScheme.onBackground,
                              ),
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
                    ],
                  ),
                ),
              ),
            ),
            if (message.role == Role.user) ...[
              const SizedBox(width: 10),
              const UserAvatar(
                radius: 18,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
