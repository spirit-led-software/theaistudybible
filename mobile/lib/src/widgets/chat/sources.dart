import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/ai_response/source_document.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/chat/share_dialog.dart';
import 'package:url_launcher/link.dart';

class Sources extends HookConsumerWidget {
  final String? chatId;
  final ChatMessage message;
  final ChatMessage? previousMessage;

  final bool isChatLoading;
  final bool isCurrentResponse;

  const Sources({
    Key? key,
    this.chatId,
    required this.message,
    this.previousMessage,
    this.isChatLoading = false,
    this.isCurrentResponse = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isMounted = useIsMounted();

    final isLoading = useState(false);
    final sourceDocuments = useState<List<SourceDocument>>(ref
            .read(aiResponseSourceDocumentsProvider(
              message.id,
              message.uuid,
              chatId,
            ))
            .value ??
        []);
    final hasLoaded = useState(false);

    final showSources = useState(false);
    final copied = useState(false);

    useEffect(
      () {
        if (sourceDocuments.value.isEmpty &&
            !hasLoaded.value &&
            !isChatLoading) {
          isLoading.value = true;
          final sourceDocumentsFuture =
              ref.read(aiResponseSourceDocumentsProvider(
            message.id,
            message.uuid,
            chatId,
          ).future);

          sourceDocumentsFuture.then((value) {
            if (isMounted()) {
              sourceDocuments.value = value;
              hasLoaded.value = true;
            }
          }).catchError((e) {
            debugPrint("Failed to load sources: ${e.toString()}");
          }).whenComplete(() {
            if (isMounted()) isLoading.value = false;
          });
        }
        return () {};
      },
      [
        chatId,
        message.id,
        message.uuid,
        isChatLoading,
        showSources.value,
      ],
    );

    return Theme(
      data: context.theme.copyWith(
        dividerColor: Colors.transparent,
        visualDensity: RAIVisualDensity.tightest,
      ),
      child: ExpansionTile(
        leading: Icon(
          showSources.value
              ? Icons.keyboard_arrow_up
              : Icons.keyboard_arrow_down,
          size: 15,
          color: context.colorScheme.onBackground,
        ),
        title: Text.rich(
          TextSpan(
            text: "Sources",
            style: const TextStyle(
              fontSize: 12,
            ),
            children: [
              if (isLoading.value) ...[
                WidgetSpan(
                  alignment: PlaceholderAlignment.middle,
                  child: Container(
                    width: 10,
                    height: 10,
                    margin: const EdgeInsets.symmetric(
                      horizontal: 5,
                    ),
                    child: SpinKitPulse(
                      color: context.colorScheme.onBackground,
                      size: 10,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            IconButton(
              visualDensity: RAIVisualDensity.tightest,
              iconSize: 14,
              icon: FaIcon(
                copied.value ? FontAwesomeIcons.check : FontAwesomeIcons.copy,
              ),
              color: copied.value
                  ? Colors.green
                  : context.colorScheme.onBackground,
              onPressed: () {
                HapticFeedback.mediumImpact();
                copied.value = true;
                Clipboard.setData(
                  ClipboardData(text: message.content),
                );
                Future.delayed(
                  const Duration(seconds: 2),
                  () => copied.value = false,
                );
              },
            ),
            IconButton(
              visualDensity: RAIVisualDensity.tightest,
              iconSize: 14,
              icon: const FaIcon(
                FontAwesomeIcons.shareFromSquare,
              ),
              color: context.colorScheme.onBackground,
              onPressed: () {
                HapticFeedback.mediumImpact();
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
            )
          ],
        ),
        tilePadding: const EdgeInsets.only(left: 10),
        onExpansionChanged: (value) {
          showSources.value = value;
        },
        children: [
          SizedBox(
            height: sourceDocuments.value.isNotEmpty ? 50 : 25,
            child: ListView.builder(
              shrinkWrap: true,
              scrollDirection: Axis.horizontal,
              itemCount: sourceDocuments.value.isNotEmpty
                  ? sourceDocuments.value.length
                  : 1,
              itemBuilder: (context, index) {
                if (sourceDocuments.value.isEmpty) {
                  return const Text("None");
                }

                final source = sourceDocuments.value[index];
                return Link(
                  uri: Uri.parse(source.metadata["url"]),
                  builder: (context, followLink) {
                    return Container(
                      width: 200,
                      margin: const EdgeInsets.symmetric(horizontal: 5),
                      child: ListTile(
                        onTap: () {
                          followLink!();
                        },
                        dense: true,
                        visualDensity: RAIVisualDensity.tightest,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        tileColor: context.primaryColor,
                        leading: Icon(
                          CupertinoIcons.link,
                          color: context.colorScheme.onPrimary,
                          size: 20,
                        ),
                        titleAlignment: ListTileTitleAlignment.center,
                        title: Text(
                          source.metadata["name"].toString(),
                          textAlign: TextAlign.center,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                        ),
                        titleTextStyle: TextStyle(
                          color: context.colorScheme.onPrimary,
                        ),
                        subtitle: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (source.metadata["type"]
                                    .toString()
                                    .toLowerCase() ==
                                "webpage") ...[
                              Text(
                                Uri.parse(
                                  source.metadata["url"].toString(),
                                )
                                    .pathSegments
                                    .lastWhere((element) => element.isNotEmpty),
                                textAlign: TextAlign.center,
                                softWrap: false,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                            if (source.metadata["type"]
                                    .toString()
                                    .toLowerCase() ==
                                "file") ...[
                              ClipRRect(
                                clipBehavior: Clip.hardEdge,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (source.metadata["loc"]["pageNumber"] !=
                                        null) ...[
                                      Text(
                                        'P:${source.metadata["loc"]["pageNumber"].toString()}',
                                        softWrap: false,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(
                                        width: 5,
                                      )
                                    ],
                                    if (source.metadata["loc"]["lines"] !=
                                        null) ...[
                                      Text(
                                        'L:${source.metadata["loc"]["lines"]["from"].toString()}'
                                        '-${source.metadata["loc"]["lines"]["to"].toString()}',
                                        softWrap: false,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(
                                        width: 5,
                                      )
                                    ],
                                  ],
                                ),
                              )
                            ],
                          ],
                        ),
                        subtitleTextStyle: TextStyle(
                          color: context.colorScheme.onPrimary,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
