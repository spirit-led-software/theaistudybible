import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/ai_response/source_document.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
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
    final sourceDocuments = useState<List<SourceDocument>>([]);
    final hasLoaded = useState(false);

    useEffect(
      () {
        if (sourceDocuments.value.isEmpty && !hasLoaded.value && !isChatLoading) {
          isLoading.value = true;
          ref.read(aiResponseSourceDocumentsProvider(message.uuid).future).then((value) {
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
        message.uuid,
        isChatLoading,
      ],
    );

    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Sources",
          style: context.textTheme.labelLarge,
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: context.width,
          height: sourceDocuments.value.isNotEmpty ? 50 : 25,
          child: ListView.builder(
            shrinkWrap: true,
            scrollDirection: Axis.horizontal,
            itemCount: sourceDocuments.value.isNotEmpty ? sourceDocuments.value.length : 1,
            itemBuilder: (context, index) {
              final sourcesSorted = sourceDocuments.value
                ..sort(
                  (a, b) => a.distance.compareTo(b.distance),
                );

              if (sourceDocuments.value.isEmpty && !isLoading.value) {
                return const Text("None", textAlign: TextAlign.center);
              } else if (isLoading.value) {
                return SpinKitPulse(
                  color: context.colorScheme.onBackground,
                  size: 20,
                );
              }

              final source = sourcesSorted[index];
              return Link(
                uri: Uri.parse(source.metadata["url"]),
                builder: (context, followLink) {
                  return Container(
                    width: 250,
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
                      trailing: Icon(
                        CupertinoIcons.link,
                        color: context.colorScheme.onPrimary,
                        size: 20,
                      ),
                      titleAlignment: ListTileTitleAlignment.center,
                      title: Text(
                        source.name,
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
                          if (source.isWebpage) ...[
                            Text(
                              source.hasTitle
                                  ? source.title
                                  : Uri.parse(
                                      source.url,
                                    ).pathSegments.lastWhere((element) => element.isNotEmpty),
                              textAlign: TextAlign.center,
                              softWrap: false,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          if (source.isFile) ...[
                            ClipRRect(
                              clipBehavior: Clip.hardEdge,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (source.hasPageNumber) ...[
                                    Text(
                                      'P:${source.pageNumber}',
                                      softWrap: false,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(
                                      width: 5,
                                    )
                                  ],
                                  if (source.hasLines) ...[
                                    Text(
                                      'L:${source.linesFrom}'
                                      '-${source.linesTo}',
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
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
