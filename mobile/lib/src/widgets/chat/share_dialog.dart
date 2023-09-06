import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:share_plus/share_plus.dart';

class ShareDialog extends HookWidget {
  final ChatMessage message;
  final ChatMessage? previousMessage;

  const ShareDialog({
    Key? key,
    required this.message,
    this.previousMessage,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final includePreviousMessage = useState(false);
    final shareableContent = useState("RevelationsAI: ${message.content}\n");

    useEffect(
      () {
        if (includePreviousMessage.value && previousMessage != null) {
          shareableContent.value =
              "Me: ${previousMessage!.content}\n\nRevelationsAI: ${message.content}\n";
        } else {
          shareableContent.value = "RevelationsAI: ${message.content}\n";
        }

        return () {};
      },
      [
        includePreviousMessage.value,
        previousMessage,
      ],
    );

    return AlertDialog.adaptive(
      title: const Text("Share"),
      content: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            "Include previous message",
          ),
          const SizedBox(
            width: 10,
          ),
          Switch.adaptive(
            value: includePreviousMessage.value,
            onChanged: (value) => includePreviousMessage.value = value,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("Cancel"),
        ),
        TextButton(
          onPressed: () {
            Navigator.pop(context, shareableContent.value);
            Share.share(
              shareableContent.value,
              subject: "Message from RevelationsAI",
            );
          },
          child: const Text("Share"),
        ),
      ],
    );
  }
}
