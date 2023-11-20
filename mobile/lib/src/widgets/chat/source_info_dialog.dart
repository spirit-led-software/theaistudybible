import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/utils/filter_source_document.dart';
import 'package:url_launcher/link.dart';

class SourceInfoDialog extends HookConsumerWidget {
  final SourceDocument sourceDocument;

  const SourceInfoDialog({
    Key? key,
    required this.sourceDocument,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Dialog(
      child: Link(
        uri: Uri.parse(sourceDocument.url),
        target: LinkTarget.blank,
        builder: (context, followLink) {
          return GestureDetector(
            behavior: HitTestBehavior.translucent,
            onTap: () {
              followLink!();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 40,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    sourceDocument.hasTitle ? sourceDocument.title! : sourceDocument.name,
                    textAlign: TextAlign.center,
                    style: context.textTheme.titleMedium,
                  ),
                  if (!sourceDocument.hasTitle && sourceDocument.isWebpage) ...[
                    const SizedBox(height: 10),
                    Text(
                      Uri.parse(
                        sourceDocument.url,
                      ).pathSegments.lastWhere((element) => element.isNotEmpty),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  if (sourceDocument.hasTitle && sourceDocument.hasAuthor) ...[
                    Text(
                      sourceDocument.author!,
                      style: context.textTheme.titleSmall,
                    ),
                  ],
                  if (sourceDocument.hasPageNumbers) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Page(s): ${sourceDocument.pageNumbers!.keys.join(', ')}',
                      style: context.textTheme.titleSmall,
                    ),
                    const SizedBox(
                      width: 5,
                    )
                  ],
                  const SizedBox(height: 10),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            "Preview:",
                            textAlign: TextAlign.left,
                            style: context.textTheme.labelLarge,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: context.height * 0.5,
                    ),
                    child: Scrollbar(
                      thumbVisibility: true,
                      child: Scrollable(
                        viewportBuilder: (context, position) {
                          return Container(
                            decoration: BoxDecoration(
                              color: context.colorScheme.background,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: context.colorScheme.onBackground.withOpacity(0.4),
                              ),
                            ),
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.symmetric(
                                vertical: 10,
                                horizontal: 20,
                              ),
                              child: Column(
                                children: [
                                  for (final pageContent in sourceDocument.pageContent.split(contentSeparator)) ...[
                                    Text(
                                      pageContent.split("---").last.trim(),
                                      style: context.textTheme.bodySmall,
                                    ),
                                    if (pageContent != sourceDocument.pageContent.split(contentSeparator).last) ...[
                                      const SizedBox(height: 10),
                                      const Divider(),
                                      const SizedBox(height: 10),
                                    ],
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  Text(
                    "Tap to view entire source",
                    style: context.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
