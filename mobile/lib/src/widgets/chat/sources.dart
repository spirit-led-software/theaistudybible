import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/providers/ai_response/source_document.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/chat/source_info_dialog.dart';
import 'package:url_launcher/link.dart';

class Sources extends HookConsumerWidget {
  final String? chatId;
  final ChatMessage message;
  final ChatMessage? previousMessage;

  final bool isChatLoading;
  final bool isCurrentResponse;

  const Sources({
    super.key,
    this.chatId,
    required this.message,
    this.previousMessage,
    this.isChatLoading = false,
    this.isCurrentResponse = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUserPrefs = ref.watch(currentUserPreferencesProvider).requireValue;

    final sourceDocuments = ref.watch(aiResponseSourceDocumentsProvider(message.uuid));

    return SizedBox(
      width: context.width,
      height: (!sourceDocuments.hasValue || sourceDocuments.requireValue.isEmpty) ? 25 : 50,
      child: Center(
        child: ListView.builder(
          shrinkWrap: true,
          scrollDirection: Axis.horizontal,
          itemCount:
              (!sourceDocuments.hasValue || sourceDocuments.requireValue.isEmpty) ? 1 : sourceDocuments.value!.length,
          itemBuilder: (context, index) {
            if (!sourceDocuments.isLoading && sourceDocuments.hasValue && sourceDocuments.requireValue.isEmpty) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(25),
                  color: context.primaryColor,
                ),
                child: Center(
                  child: Text(
                    "Sorry, there are no sources for this message.",
                    textAlign: TextAlign.center,
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: context.colorScheme.onPrimary,
                    ),
                  ),
                ),
              );
            } else if (sourceDocuments.isLoading) {
              return SpinKitPulse(
                color: context.colorScheme.onBackground,
                size: 20,
              );
            } else if (!sourceDocuments.isLoading && sourceDocuments.hasError) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(25),
                  color: context.primaryColor,
                ),
                child: Center(
                  child: Text(
                    sourceDocuments.error.toString(),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: context.textTheme.bodySmall?.copyWith(
                      color: context.colorScheme.onPrimary,
                    ),
                  ),
                ),
              );
            }

            final sourcesSorted = sourceDocuments.requireValue
              ..sort(
                (a, b) => a.distance.compareTo(b.distance),
              );
            final source = sourcesSorted[index];
            return Link(
              uri: Uri.parse(source.metadata["url"]),
              target: LinkTarget.blank,
              builder: (context, followLink) {
                return Container(
                  width: 300,
                  margin: const EdgeInsets.symmetric(horizontal: 5),
                  child: ListTile(
                    onLongPress: () {
                      if (currentUserPrefs.hapticFeedback) {
                        HapticFeedback.mediumImpact();
                      }
                      showCupertinoModalPopup(
                        context: context,
                        builder: (context) {
                          return FractionallySizedBox(
                            heightFactor: 0.90,
                            widthFactor: 1.00,
                            child: SourceInfoPreview(sourceDocument: source),
                          );
                        },
                      );
                    },
                    onTap: () {
                      followLink!();
                    },
                    dense: true,
                    visualDensity: RAIVisualDensity.tightest,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    tileColor: context.primaryColor,
                    titleAlignment: ListTileTitleAlignment.center,
                    title: Text(
                      source.hasTitle ? source.title! : source.name,
                      textAlign: TextAlign.center,
                      softWrap: true,
                      maxLines: source.hasTitle && source.hasAuthor ? 1 : 2, // leave room for author
                      overflow: TextOverflow.ellipsis,
                    ),
                    titleTextStyle: TextStyle(
                      color: context.colorScheme.onPrimary,
                    ),
                    subtitle: Column(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        if (!source.hasTitle && source.isWebpage) ...[
                          Text(
                            Uri.parse(
                              source.url,
                            ).pathSegments.lastWhere((element) => element.isNotEmpty),
                            textAlign: TextAlign.center,
                            softWrap: false,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (source.hasTitle && source.hasAuthor) ...[
                          Text(
                            source.author!,
                          ),
                        ],
                      ],
                    ),
                    subtitleTextStyle: TextStyle(
                      color: context.colorScheme.onPrimary,
                    ),
                    leading: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${((1 - (source.distance / 2)) * 100).toStringAsFixed(1)}%',
                          style: TextStyle(
                            color: context.colorScheme.onPrimary,
                          ),
                        ),
                        Text(
                          "Match",
                          style: TextStyle(
                            color: context.colorScheme.onPrimary,
                          ),
                        )
                      ],
                    ),
                    trailing: FaIcon(
                      FontAwesomeIcons.arrowUpRightFromSquare,
                      color: context.colorScheme.onPrimary,
                      size: 15,
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
