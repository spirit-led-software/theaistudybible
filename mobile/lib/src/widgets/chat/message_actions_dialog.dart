import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/ai_response/reaction.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/ai_response/reaction.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/chat/markdown.dart';
import 'package:revelationsai/src/widgets/chat/reaction_comment_dialog.dart';
import 'package:revelationsai/src/widgets/chat/sources.dart';

class MessageActionsDialog extends HookConsumerWidget {
  final ChatMessage? previousMessage;
  final ChatMessage message;

  const MessageActionsDialog({super.key, required this.message, this.previousMessage});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hapticFeedback = ref.watch(currentUserPreferencesProvider).requireValue.hapticFeedback;

    final reactionsNotifier =
        message.role == Role.assistant ? ref.watch(aiResponseReactionsProvider(message.uuid).notifier) : null;
    final reactions =
        message.role == Role.assistant ? ref.watch(aiResponseReactionsProvider(message.uuid)).value : null;

    final isMounted = useIsMounted();
    final copied = useState(false);

    return Dialog(
      backgroundColor: context.colorScheme.background,
      child: Container(
        padding: const EdgeInsets.symmetric(
          vertical: 20,
          horizontal: 10,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ConstrainedBox(
              constraints: BoxConstraints(
                maxHeight: context.height * 0.4,
              ),
              child: Scrollbar(
                thumbVisibility: true,
                child: ChatMessageMarkdown(
                  padding: const EdgeInsets.symmetric(
                    vertical: 8,
                    horizontal: 15,
                  ),
                  followLinks: true,
                  selectable: true,
                  data: message.content.trim(),
                ),
              ),
            ),
            Divider(
              color: context.colorScheme.onBackground.withOpacity(0.4),
            ),
            Container(
              margin: const EdgeInsets.only(
                right: 10,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        visualDensity: RAIVisualDensity.tightest,
                        iconSize: 18,
                        icon: FaIcon(
                          copied.value ? FontAwesomeIcons.check : FontAwesomeIcons.copy,
                        ),
                        color: copied.value ? Colors.green : context.colorScheme.onBackground,
                        onPressed: () {
                          if (hapticFeedback) HapticFeedback.mediumImpact();
                          copied.value = true;
                          Clipboard.setData(
                            ClipboardData(text: message.content),
                          );
                          Future.delayed(const Duration(seconds: 3), () {
                            if (isMounted()) copied.value = false;
                          });
                        },
                      ),
                      if (message.role == Role.assistant) ...[
                        IconButton(
                          visualDensity: RAIVisualDensity.tightest,
                          iconSize: 20,
                          icon: Icon(
                            reactions?.where((element) => element.reaction == AiResponseReactionType.LIKE).isNotEmpty ??
                                    false
                                ? CupertinoIcons.hand_thumbsup_fill
                                : CupertinoIcons.hand_thumbsup,
                          ),
                          color: reactions
                                      ?.where((element) => element.reaction == AiResponseReactionType.LIKE)
                                      .isNotEmpty ??
                                  false
                              ? Colors.green
                              : context.colorScheme.onBackground,
                          onPressed: () {
                            if (hapticFeedback) HapticFeedback.mediumImpact();
                            reactionsNotifier!.createReaction(
                              reactionType: AiResponseReactionType.LIKE,
                            );
                          },
                        ),
                        IconButton(
                          visualDensity: RAIVisualDensity.tightest,
                          iconSize: 20,
                          icon: Icon(
                            reactions
                                        ?.where((element) => element.reaction == AiResponseReactionType.DISLIKE)
                                        .isNotEmpty ??
                                    false
                                ? CupertinoIcons.hand_thumbsdown_fill
                                : CupertinoIcons.hand_thumbsdown,
                          ),
                          color: reactions
                                      ?.where((element) => element.reaction == AiResponseReactionType.DISLIKE)
                                      .isNotEmpty ??
                                  false
                              ? Colors.red
                              : context.colorScheme.onBackground,
                          onPressed: () {
                            if (hapticFeedback) HapticFeedback.mediumImpact();
                            showDialog(
                              context: context,
                              builder: (context) {
                                return ResponseReactionCommentDialog(
                                  aiResponseId: message.uuid,
                                  reactionType: AiResponseReactionType.DISLIKE,
                                );
                              },
                            );
                          },
                        ),
                      ],
                    ],
                  ),
                  Text(
                    DateFormat()
                        .add_yMd()
                        .addPattern(DateFormat.HOUR_MINUTE)
                        .format((message.createdAt ?? DateTime.now()).toLocal()),
                  ),
                ],
              ),
            ),
            if (message.role == Role.assistant) ...[
              Container(
                padding: const EdgeInsets.only(
                  top: 5,
                  left: 10,
                  right: 10,
                ),
                child: Sources(message: message),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
