import 'dart:io';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/utils/capitalization.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/link.dart';

class SourceInfoPreview extends HookConsumerWidget {
  final SourceDocument sourceDocument;

  const SourceInfoPreview({
    super.key,
    required this.sourceDocument,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hapticFeedback = ref.watch(
      currentUserPreferencesProvider.select((value) => value.value?.hapticFeedback ?? true),
    );

    final isMounted = useIsMounted();
    final loading = useState(false);
    final error = useState(false);
    final copied = useState(false);

    return Container(
      decoration: BoxDecoration(
        color: context.theme.colorScheme.background,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          Container(
            height: 75,
            decoration: BoxDecoration(
              color: context.theme.primaryColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                const SizedBox(width: 20),
                Expanded(
                  child: Text(
                    "Source Info",
                    style: context.textTheme.titleMedium?.copyWith(
                      color: context.theme.colorScheme.onPrimary,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: Icon(
                    Icons.close,
                    color: context.theme.colorScheme.onPrimary,
                  ),
                ),
                const SizedBox(width: 20),
              ],
            ),
          ),
          Link(
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
                    vertical: 20,
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
                          style: context.textTheme.labelSmall,
                          textAlign: TextAlign.center,
                        ),
                      ],
                      if (sourceDocument.hasPageNumbers) ...[
                        const SizedBox(height: 10),
                        Text(
                          'Page(s): ${sourceDocument.pageNumbers!.keys.join(', ')}',
                          style: context.textTheme.labelMedium,
                        ),
                        const SizedBox(
                          width: 5,
                        )
                      ],
                      const SizedBox(height: 10),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 8,
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
                      Stack(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: context.colorScheme.onBackground,
                              ),
                            ),
                            height: context.height * 0.55,
                            child: InAppWebView(
                              onLoadStart: (controller, url) {
                                if (isMounted()) loading.value = true;
                              },
                              onLoadStop: (controller, url) {
                                if (isMounted()) loading.value = false;
                              },
                              onLoadError: (controller, url, code, message) {
                                if (isMounted()) error.value = true;
                              },
                              onLoadHttpError: (controller, url, statusCode, description) {
                                if (isMounted()) error.value = true;
                              },
                              initialUrlRequest: URLRequest(
                                url: Uri.parse(
                                  sourceDocument.isFile && Platform.isAndroid
                                      ? 'https://docs.google.com/viewer?url=${sourceDocument.url}'
                                      : sourceDocument.url,
                                ),
                              ),
                              initialOptions: InAppWebViewGroupOptions(
                                crossPlatform: InAppWebViewOptions(
                                  disableVerticalScroll: true,
                                  disableHorizontalScroll: true,
                                  javaScriptCanOpenWindowsAutomatically: false,
                                  supportZoom: false,
                                  disableContextMenu: true,
                                  horizontalScrollBarEnabled: false,
                                  verticalScrollBarEnabled: false,
                                ),
                                android: AndroidInAppWebViewOptions(
                                  useHybridComposition: true,
                                ),
                              ),
                            ),
                          ),
                          if (loading.value) ...[
                            Positioned.fill(
                              child: Container(
                                color: Colors.black.withOpacity(0.5),
                                child: Center(
                                  child: CircularProgressIndicator(
                                    color: context.colorScheme.onBackground,
                                  ),
                                ),
                              ),
                            ),
                          ],
                          if (error.value) ...[
                            Positioned.fill(
                              child: Container(
                                color: Colors.black.withOpacity(0.5),
                                child: Center(
                                  child: Text(
                                    "Error loading preview",
                                    style: context.textTheme.labelLarge,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            sourceDocument.type.toTitleCase(),
                            style: context.textTheme.labelLarge,
                          ),
                          Row(
                            children: [
                              IconButton(
                                onPressed: () {
                                  if (hapticFeedback) HapticFeedback.mediumImpact();
                                  if (copied.value) return;
                                  Clipboard.setData(
                                    ClipboardData(
                                      text: sourceDocument.url,
                                    ),
                                  ).then((value) {
                                    if (isMounted()) {
                                      if (hapticFeedback) HapticFeedback.mediumImpact();
                                      copied.value = true;
                                    }
                                  });
                                  Future.delayed(const Duration(seconds: 3), () {
                                    if (isMounted()) copied.value = false;
                                  });
                                },
                                visualDensity: RAIVisualDensity.tightest,
                                iconSize: 18,
                                icon: AnimatedCrossFade(
                                  duration: const Duration(milliseconds: 200),
                                  crossFadeState: copied.value ? CrossFadeState.showFirst : CrossFadeState.showSecond,
                                  firstChild: const FaIcon(
                                    FontAwesomeIcons.check,
                                    color: Colors.green,
                                  ),
                                  secondChild: const FaIcon(
                                    FontAwesomeIcons.copy,
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed: () {
                                  if (hapticFeedback) HapticFeedback.mediumImpact();
                                  Share.shareUri(
                                    Uri.parse(sourceDocument.url),
                                  );
                                },
                                visualDensity: RAIVisualDensity.tightest,
                                iconSize: 20,
                                icon: const Icon(
                                  CupertinoIcons.share_up,
                                ),
                              ),
                            ],
                          ),
                        ],
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
        ],
      ),
    );
  }
}
