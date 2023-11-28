import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:markdown/markdown.dart' as md;
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:url_launcher/url_launcher_string.dart';

class MessageMarkdownBody extends StatelessWidget {
  final String data;
  final bool selectable;
  final bool followLinks;

  const MessageMarkdownBody({
    super.key,
    required this.data,
    this.selectable = false,
    this.followLinks = false,
  });

  @override
  Widget build(BuildContext context) {
    return MarkdownBody(
      shrinkWrap: true,
      selectable: selectable,
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
    );
  }
}
