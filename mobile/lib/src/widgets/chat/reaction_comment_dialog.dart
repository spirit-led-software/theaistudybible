import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/ai_response/reaction.dart';
import 'package:revelationsai/src/providers/ai_response/reaction.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class ReactionCommentDialog extends HookConsumerWidget {
  final String? aiResponseId;
  final AiResponseReactionType reactionType;

  const ReactionCommentDialog({super.key, required this.aiResponseId, required this.reactionType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reactionNotifier = ref.watch(aiResponseReactionsProvider(aiResponseId).notifier);

    final formKey = useRef(GlobalKey<FormState>());

    final textController = useTextEditingController();
    final textFocusNode = useFocusNode();

    return AlertDialog(
      title: const Text(
        'Comment',
      ),
      content: Form(
        key: formKey.value,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your feedback is valuable to us.',
              style: context.textTheme.titleSmall,
            ),
            const SizedBox(height: 10),
            const Text('You can leave a comment below to help us improve future responses.'),
            const SizedBox(height: 5),
            TextFormField(
              controller: textController,
              focusNode: textFocusNode,
              decoration: const InputDecoration(
                hintText: '(Optional)',
              ),
              maxLines: 4,
              minLines: 2,
              maxLength: 150,
              maxLengthEnforcement: MaxLengthEnforcement.enforced,
              onFieldSubmitted: (_) {
                textFocusNode.unfocus();
              },
              onTapOutside: (_) {
                textFocusNode.unfocus();
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            if (formKey.value.currentState!.validate()) {
              reactionNotifier.createReaction(
                reactionType: reactionType,
                comment: textController.text,
              );
              Navigator.of(context).pop();
            }
          },
          child: const Text('Submit'),
        ),
      ],
    );
  }
}
