import 'package:accordion/accordion.dart';
import 'package:accordion/controllers.dart';
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
import 'package:skeletonizer/skeletonizer.dart';
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
    final isMounted = useIsMounted();

    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<List<SourceDocument>> sourceDocuments = useState(ref
            .read(aiResponseSourceDocumentsProvider(
              message.id,
              message.uuid,
              chatId,
            ))
            .value ??
        []);

    ValueNotifier<bool> showSources = useState(false);
    ValueNotifier<bool> copied = useState(false);

    useEffect(
      () {
        loading.value = true;
        final sourceDocumentsFuture =
            ref.read(aiResponseSourceDocumentsProvider(
          message.id,
          message.uuid,
          chatId,
        ).future);

        sourceDocumentsFuture.then((value) {
          if (isMounted()) sourceDocuments.value = value;
        }).catchError((e) {
          debugPrint("Failed to load sources: ${e.toString()}");
        }).whenComplete(() {
          if (isMounted()) loading.value = false;
        });

        return () {};
      },
      [
        chatId,
        message.id,
        message.uuid,
      ],
    );

    return Accordion(
      paddingListTop: 0,
      paddingListBottom: 0,
      paddingListHorizontal: 0,
      disableScrolling: true,
      scaleWhenAnimating: false,
      flipLeftIconIfOpen: false,
      flipRightIconIfOpen: false,
      headerBackgroundColor: Colors.white,
      children: [
        AccordionSection(
          headerPadding: EdgeInsets.zero,
          headerBackgroundColor: Colors.transparent,
          contentBackgroundColor: Colors.transparent,
          contentBorderColor: Colors.transparent,
          leftIcon: IconButton(
            visualDensity: RAIVisualDensity.tightest,
            iconSize: 14,
            alignment: Alignment.center,
            constraints: BoxConstraints.tight(const Size.square(14)),
            icon: FaIcon(
              showSources.value
                  ? FontAwesomeIcons.angleUp
                  : FontAwesomeIcons.angleDown,
              color: RAIColors.primary,
            ),
            onPressed: () => showSources.value = !showSources.value,
          ),
          rightIcon: Row(
            mainAxisSize: MainAxisSize.max,
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
          isOpen: showSources.value,
          onCloseSection: () => showSources.value = false,
          onOpenSection: () => showSources.value = true,
          scrollIntoViewOfItems: ScrollIntoViewOfItems.none,
          header: Row(
            children: [
              Text(
                "Sources",
                style: TextStyle(
                  fontSize: 12,
                  color: RAIColors.primary,
                ),
              ),
              if (loading.value) ...[
                const SizedBox(width: 5),
                SpinKitWave(
                  color: RAIColors.primary,
                  size: 10,
                )
              ],
            ],
          ),
          content: ListView.builder(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: sourceDocuments.value.length,
            itemBuilder: (context, index) {
              final source = sourceDocuments.value[index];
              return Link(
                uri: Uri.parse(source.metadata['url']),
                target: LinkTarget.self,
                builder: (context, followLink) {
                  return ListTile(
                    dense: true,
                    visualDensity: RAIVisualDensity.tightest,
                    leading: Skeleton.keep(
                      child: Icon(
                        Icons.link,
                        size: 15,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    title: Text(
                      source.metadata['name'],
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
        ),
      ],
    );
  }
}
