import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/chat/share_dialog.dart';
import 'package:revelationsai/src/widgets/chat/sources.dart';

class MessageActionsDialog extends HookConsumerWidget {
  final ChatMessage? previousMessage;
  final ChatMessage message;

  const MessageActionsDialog({Key? key, required this.message, this.previousMessage}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hapticFeedback = ref.watch(currentUserPreferencesProvider).requireValue.hapticFeedback;

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
                maxHeight: context.height * 0.3,
              ),
              child: Scrollbar(
                thumbVisibility: true,
                child: SingleChildScrollView(
                  padding: EdgeInsets.zero,
                  child: Container(
                    padding: const EdgeInsets.only(
                      bottom: 10,
                      left: 10,
                      right: 15,
                    ),
                    child: SelectableText.rich(
                      TextSpan(
                        text: message.content,
                      ),
                    ),
                  ),
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
                        iconSize: 15,
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
                      IconButton(
                        visualDensity: RAIVisualDensity.tightest,
                        iconSize: 15,
                        icon: const FaIcon(
                          FontAwesomeIcons.shareFromSquare,
                        ),
                        color: context.colorScheme.onBackground,
                        onPressed: () {
                          if (hapticFeedback) HapticFeedback.mediumImpact();
                          showDialog(
                            context: context,
                            builder: (context) {
                              return ShareDialog(
                                message: message,
                                previousMessage: previousMessage,
                              );
                            },
                          );
                        },
                      ),
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
