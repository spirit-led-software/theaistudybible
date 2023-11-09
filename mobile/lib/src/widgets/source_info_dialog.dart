import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
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
        target: LinkTarget.self,
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
                children: [
                  Text(
                    sourceDocument.name,
                    style: context.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  if (sourceDocument.isWebpage) ...[
                    Text(
                      sourceDocument.hasTitle
                          ? sourceDocument.title
                          : Uri.parse(
                              sourceDocument.url,
                            ).pathSegments.lastWhere((element) => element.isNotEmpty),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  if (sourceDocument.isFile) ...[
                    if (sourceDocument.hasPageNumber) ...[
                      Text(
                        'Page: ${sourceDocument.pageNumber}',
                        style: context.textTheme.titleSmall,
                      ),
                      const SizedBox(
                        width: 5,
                      )
                    ],
                    if (sourceDocument.hasLines) ...[
                      Text(
                        'Lines: ${sourceDocument.linesFrom}'
                        '-${sourceDocument.linesTo}',
                        style: context.textTheme.titleSmall,
                      ),
                      const SizedBox(
                        width: 5,
                      )
                    ],
                  ],
                  const SizedBox(height: 30),
                  Text(
                    "Tap to view source",
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
