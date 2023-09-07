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
import 'package:revelationsai/src/providers/ai_response/source_document.dart';
import 'package:revelationsai/src/widgets/chat/share_dialog.dart';
import 'package:url_launcher/link.dart';

class Sources extends HookConsumerWidget {
  final String? chatId;
  final ChatMessage message;
  final ChatMessage? previousMessage;

  const Sources({
    Key? key,
    this.chatId,
    required this.message,
    this.previousMessage,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sourceDocuments = ref.watch(aiResponseSourceDocumentsProvider(
      message,
      chatId,
    ));

    ValueNotifier<bool> showSources = useState(false);
    ValueNotifier<bool> copied = useState(false);

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
          headerBackgroundColor: Colors.grey.shade600,
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
          content: sourceDocuments.isLoading
              ? Center(
                  child: SpinKitHourGlass(
                    color: RAIColors.primary,
                    size: 20,
                  ),
                )
              : Column(
                  children: [
                    if (showSources.value)
                      ListView.builder(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: sourceDocuments.requireValue.length,
                        itemBuilder: (context, index) {
                          final source = sourceDocuments.requireValue[index];
                          return Link(
                            uri: Uri.parse(source.metadata!['url']),
                            target: LinkTarget.self,
                            builder: (context, followLink) {
                              return ListTile(
                                visualDensity: VisualDensity.compact,
                                dense: true,
                                leading: Icon(
                                  Icons.link,
                                  size: 15,
                                  color: Colors.grey.shade600,
                                ),
                                title: Text(
                                  source.metadata!['name'],
                                  softWrap: false,
                                  overflow: TextOverflow.fade,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                onTap: followLink,
                              );
                            },
                          );
                        },
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}
