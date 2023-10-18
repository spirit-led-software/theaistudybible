import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/ai_response/source_document.dart';
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
      data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          visualDensity: RAIVisualDensity.tightest),
      child: ExpansionTile(
        leading: Icon(
          showSources.value
              ? Icons.keyboard_arrow_up
              : Icons.keyboard_arrow_down,
          size: 15,
          color: RAIColors.primary,
        ),
        title: Text.rich(
          TextSpan(
            text: "Sources",
            style: TextStyle(
              fontSize: 12,
              color: RAIColors.primary,
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
                      color: RAIColors.primary,
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
                color: copied.value ? Colors.green : RAIColors.primary,
              ),
              onPressed: () {
                copied.value = true;
                Clipboard.setData(
                  ClipboardData(text: message.content),
                );
                HapticFeedback.mediumImpact();

                Future.delayed(
                  const Duration(seconds: 2),
                  () => copied.value = false,
                );
              },
            ),
            IconButton(
              visualDensity: RAIVisualDensity.tightest,
              iconSize: 14,
              icon: FaIcon(
                FontAwesomeIcons.shareFromSquare,
                color: RAIColors.primary,
              ),
              onPressed: () {
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
        onExpansionChanged: (value) {
          showSources.value = value;
        },
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              vertical: 10,
              horizontal: 0,
            ),
            height: sourceDocuments.value.isEmpty ? 50 : 100,
            child: sourceDocuments.value.isEmpty
                ? const Text("None")
                : CustomScrollView(
                    scrollDirection: Axis.horizontal,
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                        ),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final source = sourceDocuments.value[index];
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 0,
                                ),
                                child: Link(
                                  uri: Uri.parse(source.metadata["url"]),
                                  builder: (context, followLink) {
                                    return SizedBox(
                                      width: 125,
                                      height: 50,
                                      child: Card(
                                        color: RAIColors.primary,
                                        margin: const EdgeInsets.all(5),
                                        elevation: 1,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(25),
                                        ),
                                        child: InkWell(
                                          onTap: followLink,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                            ),
                                            child: Column(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text(
                                                  source.metadata["name"]
                                                      .split(" - ")[0],
                                                  textAlign: TextAlign.center,
                                                  softWrap: false,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                                if ((source.metadata["type"]
                                                            as String)
                                                        .toLowerCase() ==
                                                    "webpage") ...[
                                                  Text(
                                                    Uri.parse(
                                                      source.metadata["url"],
                                                    ).pathSegments.lastWhere(
                                                        (element) =>
                                                            element.isNotEmpty),
                                                    textAlign: TextAlign.center,
                                                    softWrap: false,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      fontSize: 10,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                ],
                                                if ((source.metadata["type"]
                                                            as String)
                                                        .toLowerCase() ==
                                                    "file") ...[
                                                  Row(
                                                    mainAxisSize:
                                                        MainAxisSize.min,
                                                    mainAxisAlignment:
                                                        MainAxisAlignment
                                                            .center,
                                                    children: [
                                                      if (source.metadata["loc"]
                                                              ["pageNumber"] !=
                                                          null) ...[
                                                        Text(
                                                          'Page: ${source.metadata["loc"]["pageNumber"].toString()}',
                                                          softWrap: false,
                                                          overflow: TextOverflow
                                                              .ellipsis,
                                                          style:
                                                              const TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 10,
                                                          ),
                                                        ),
                                                        const SizedBox(
                                                          width: 5,
                                                        )
                                                      ],
                                                      if (source.metadata["loc"]
                                                              ["lines"] !=
                                                          null) ...[
                                                        Text(
                                                          'Lines: ${source.metadata["loc"]["lines"]["from"].toString()}'
                                                          '-${source.metadata["loc"]["lines"]["to"].toString()}',
                                                          softWrap: false,
                                                          overflow: TextOverflow
                                                              .ellipsis,
                                                          style:
                                                              const TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 10,
                                                          ),
                                                        ),
                                                        const SizedBox(
                                                          width: 5,
                                                        )
                                                      ],
                                                    ],
                                                  )
                                                ],
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                            childCount: sourceDocuments.value.length,
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
