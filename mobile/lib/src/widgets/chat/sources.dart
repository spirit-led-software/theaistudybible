import 'package:accordion/accordion.dart';
import 'package:accordion/controllers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/search.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/services/ai_response.dart';
import 'package:revelationsai/src/widgets/chat/share_dialog.dart';
import 'package:url_launcher/url_launcher_string.dart';

class Sources extends HookConsumerWidget {
  final String chatId;
  final ChatMessage message;
  final ChatMessage? previousMessage;

  const Sources({
    Key? key,
    required this.chatId,
    required this.message,
    this.previousMessage,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<bool> showSources = useState(false);
    ValueNotifier<List<SourceDocument>> sources = useState([]);
    ValueNotifier<bool> copied = useState(false);

    useEffect(
      () {
        if (showSources.value && sources.value.isEmpty) {
          loading.value = true;
          if (message.uuid == null) {
            AiResponseService.searchForAiResponses(
              query: Query(
                AND: [
                  Query(
                    OR: [
                      Query(
                        eq: ColumnValue(
                          column: 'aiId',
                          value: message.id,
                        ),
                      ),
                      Query(
                        eq: ColumnValue(
                          column: 'id',
                          value: message.uuid!,
                        ),
                      ),
                    ],
                  ),
                  Query(
                    eq: ColumnValue(
                      column: 'chatId',
                      value: chatId,
                    ),
                  )
                ],
              ),
              session: currentUser.requireValue!.session,
            ).then((value) {
              AiResponseService.getAiResponseSourceDocuments(
                      id: value.entities.first.id,
                      session: currentUser.requireValue!.session)
                  .then((value) {
                sources.value = value;
              }).whenComplete(() => loading.value = false);
            });
          } else {
            AiResponseService.getAiResponseSourceDocuments(
              id: message.uuid!,
              session: currentUser.requireValue!.session,
            ).then((value) {
              sources.value = value;
            }).whenComplete(() {
              loading.value = false;
            });
          }
        }
        return () {};
      },
      [
        currentUser,
        message,
        chatId,
        showSources.value,
        sources.value,
      ],
    );

    return Accordion(
      paddingListTop: 0,
      paddingListBottom: 0,
      paddingListHorizontal: 0,
      disableScrolling: true,
      scaleWhenAnimating: false,
      flipLeftIconIfOpen: true,
      flipRightIconIfOpen: false,
      
      children: [
        AccordionSection(
          headerPadding: EdgeInsets.zero,
          headerBackgroundColor: RAIColors.secondary,
          leftIcon: Container(
            padding: EdgeInsets.zero,
            margin: EdgeInsets.zero,
            child: IconButton(
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
              iconSize: 14,
              alignment: Alignment.center,
              constraints: BoxConstraints.tight(const Size.square(14)),
              icon: const FaIcon(
                FontAwesomeIcons.angleDown,
                color: Colors.white,
              ),
              onPressed: () => showSources.value = !showSources.value,
            ),
          ),
          rightIcon: Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              IconButton(
                style: ButtonStyle(
                  padding: MaterialStateProperty.all(
                    EdgeInsets.zero,
                  ),
                  visualDensity: VisualDensity.compact,
                  iconSize: MaterialStateProperty.all(14),
                  fixedSize: MaterialStateProperty.all(
                    const Size.square(20),
                  ),
                ),
                icon: FaIcon(
                  copied.value ? FontAwesomeIcons.check : FontAwesomeIcons.copy,
                  color: copied.value ? Colors.green : Colors.white,
                ),
                onPressed: () {
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
                style: ButtonStyle(
                  padding: MaterialStateProperty.all(
                    EdgeInsets.zero,
                  ),
                  visualDensity: VisualDensity.compact,
                  iconSize: MaterialStateProperty.all(14),
                  fixedSize: MaterialStateProperty.all(
                    const Size.square(20),
                  ),
                ),
                icon: const FaIcon(
                  FontAwesomeIcons.shareFromSquare,
                  color: Colors.white,
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
          isOpen: showSources.value,
          onCloseSection: () => showSources.value = false,
          onOpenSection: () => showSources.value = true,
          scrollIntoViewOfItems: ScrollIntoViewOfItems.none,
          header: const Text(
            "Sources",
            style: TextStyle(
              fontSize: 12,
              color: Colors.white,
            ),
          ),
          content: loading.value
              ? Center(
                  child: SpinKitHourGlass(
                    color: RAIColors.primary,
                    size: 20,
                  ),
                )
              : Column(
                  children: [
                    if (showSources.value)
                      ClipRect(
                        clipBehavior: Clip.antiAliasWithSaveLayer,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: sources.value.map((source) {
                            return Container(
                              margin: const EdgeInsets.only(
                                top: 5,
                                bottom: 5,
                              ),
                              child: GestureDetector(
                                child: Row(
                                  children: [
                                    const FaIcon(
                                      FontAwesomeIcons.link,
                                      size: 10,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      source.metadata!['name'],
                                      overflow: TextOverflow.ellipsis,
                                      softWrap: false,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Colors.grey.shade500,
                                      ),
                                    ),
                                  ],
                                ),
                                onTap: () async {
                                  final url = source.metadata!['url'];
                                  await launchUrlString(url);
                                },
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}
