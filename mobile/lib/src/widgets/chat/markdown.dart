import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_markdown_selectionarea/flutter_markdown_selectionarea.dart';
import 'package:markdown/markdown.dart' as md;
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:url_launcher/url_launcher_string.dart';

class ChatMessageMarkdown extends HookWidget {
  final String data;
  final bool selectable;
  final bool followLinks;
  final EdgeInsets padding;

  const ChatMessageMarkdown({
    super.key,
    required this.data,
    this.selectable = false,
    this.followLinks = false,
    this.padding = const EdgeInsets.all(0),
  });

  @override
  Widget build(BuildContext context) {
    final markdown = SingleChildScrollView(
      padding: padding,
      child: MarkdownBody(
        shrinkWrap: true,
        onTapLink: (text, href, title) {
          if (href != null && followLinks) {
            launchUrlString(
              href,
              mode: LaunchMode.externalApplication,
            );
          }
        },
        inlineSyntaxes: <md.InlineSyntax>[
          ...md.ExtensionSet.gitHubFlavored.inlineSyntaxes,
        ],
        blockSyntaxes: <md.BlockSyntax>[
          ...md.ExtensionSet.gitHubFlavored.blockSyntaxes,
        ],
        styleSheet: MarkdownStyleSheet(
          h1: context.textTheme.titleMedium,
          h2: context.textTheme.titleSmall,
          h3: context.textTheme.labelLarge,
          h4: context.textTheme.labelMedium,
          h5: context.textTheme.labelSmall,
          h6: context.textTheme.bodyLarge,
          p: context.textTheme.bodyMedium,
          a: context.textTheme.bodyMedium?.copyWith(
            color: context.colorScheme.secondary,
          ),
          blockquote: context.textTheme.bodySmall,
          blockquoteDecoration: BoxDecoration(
            color: (context.brightness == Brightness.light ? Colors.grey.shade400 : Colors.grey.shade800).withOpacity(
              0.3,
            ),
            borderRadius: BorderRadius.circular(4),
          ),
          blockquotePadding: const EdgeInsets.all(15),
          code: context.textTheme.bodySmall,
          codeblockDecoration: BoxDecoration(
            color: (context.brightness == Brightness.light ? Colors.grey.shade400 : Colors.grey.shade800).withOpacity(
              0.3,
            ),
            borderRadius: BorderRadius.circular(4),
          ),
          tableVerticalAlignment: TableCellVerticalAlignment.top,
          tableCellsPadding: const EdgeInsets.all(10),
          tableCellsDecoration: BoxDecoration(
            color: (context.brightness == Brightness.light ? Colors.grey.shade400 : Colors.grey.shade800).withOpacity(
              0.3,
            ),
            border: Border.all(
              color: context.colorScheme.onBackground,
            ),
          ),
        ),
        data: data,
      ),
    );

    if (selectable) {
      return SelectionArea(
        child: markdown,
      );
    } else {
      return markdown;
    }
  }
}
