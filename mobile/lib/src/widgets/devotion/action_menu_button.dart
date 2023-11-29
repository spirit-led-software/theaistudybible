import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/website.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/devotion/reaction_comment_dialog.dart';
import 'package:share_plus/share_plus.dart';

class DevotionActionMenuButton extends HookConsumerWidget {
  final ValueNotifier<Devotion?> devotion;
  final ValueNotifier<Map<DevotionReactionType, int>> reactionCounts;
  final bool Function() isMounted;

  const DevotionActionMenuButton({
    super.key,
    required this.devotion,
    required this.reactionCounts,
    required this.isMounted,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUserPrefs = ref.watch(currentUserPreferencesProvider).requireValue;

    return PopupMenuButton(
      position: PopupMenuPosition.under,
      offset: const Offset(0, 15),
      color: (context.brightness == Brightness.light ? Colors.grey.shade200 : context.colorScheme.primary)
          .withOpacity(0.95),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(15),
        ),
      ),
      onOpened: () {
        if (currentUserPrefs.hapticFeedback) {
          HapticFeedback.mediumImpact();
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                CupertinoIcons.hand_thumbsup_fill,
                color: context.colorScheme.onBackground,
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                "${reactionCounts.value[DevotionReactionType.LIKE]}",
                style: TextStyle(
                  color: context.colorScheme.onBackground,
                ),
              ),
            ],
          ),
          onTap: () async {
            reactionCounts.value[DevotionReactionType.LIKE] =
                (reactionCounts.value[DevotionReactionType.LIKE] ?? 0) + 1;
            await ref
                .read(devotionReactionsProvider(devotion.value!.id).notifier)
                .createReaction(reactionType: DevotionReactionType.LIKE)
                .then(
              (value) {
                ref.read(devotionReactionCountsProvider(devotion.value!.id).notifier).refresh().then((value) {
                  if (isMounted()) {
                    reactionCounts.value = value;
                  }
                });
              },
            ).catchError(
              (error, stackTrace) {
                debugPrint("Failed to create reaction: $error $stackTrace");
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      "$error",
                      style: TextStyle(
                        color: context.colorScheme.onError,
                      ),
                    ),
                    backgroundColor: context.colorScheme.error,
                  ),
                );
              },
            );
          },
        ),
        PopupMenuItem(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                CupertinoIcons.hand_thumbsdown_fill,
                color: context.colorScheme.onBackground,
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                "${(reactionCounts.value[DevotionReactionType.DISLIKE])}",
                style: TextStyle(
                  color: context.colorScheme.onBackground,
                ),
              ),
            ],
          ),
          onTap: () async {
            reactionCounts.value[DevotionReactionType.DISLIKE] =
                (reactionCounts.value[DevotionReactionType.DISLIKE] ?? 0) + 1;
            await showDialog(
              context: context,
              builder: (_) => DevotionReactionCommentDialog(
                devotionId: devotion.value!.id,
                reactionType: DevotionReactionType.DISLIKE,
              ),
            ).then(
              (value) {
                ref.read(devotionReactionCountsProvider(devotion.value!.id).notifier).refresh().then((value) {
                  if (isMounted()) {
                    reactionCounts.value = value;
                  }
                });
              },
            ).catchError(
              (error, stackTrace) {
                debugPrint("Failed to create reaction: $error $stackTrace");
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      "$error",
                      style: TextStyle(
                        color: context.colorScheme.onError,
                      ),
                    ),
                    backgroundColor: context.colorScheme.error,
                  ),
                );
              },
            );
          },
        ),
        PopupMenuItem(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                CupertinoIcons.share_up,
                color: context.colorScheme.onBackground,
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                "Share",
                style: TextStyle(
                  color: context.colorScheme.onBackground,
                ),
              ),
            ],
          ),
          onTap: () {
            Share.shareUri(Uri.parse('${Website.url}/devotions/${devotion.value!.id}'));
          },
        ),
      ],
      icon: Icon(
        Icons.thumbs_up_down,
        color: context.colorScheme.onSecondary,
      ),
    );
  }
}
