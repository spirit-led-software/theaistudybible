import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/constants/website.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/single.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/screens/devotion/devotion_modal.dart';
import 'package:revelationsai/src/utils/advertisement.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/link.dart';

class DevotionScreen extends HookConsumerWidget {
  final String? devotionId;

  const DevotionScreen({
    super.key,
    this.devotionId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    final isMounted = useIsMounted();
    final loading = useState(false);
    final devotion = useState<Devotion?>(null);
    final sourceDocs = useState<List<SourceDocument>>([]);
    final images = useState<List<DevotionImage>>([]);
    final reactionCounts = useState<Map<DevotionReactionType, int>>({});

    final fetchDevoData = useCallback((String? devoId) async {
      await Future.wait([
        ref.read(singleDevotionProvider(devoId).future),
        ref.read(devotionSourceDocumentsProvider(devoId).future),
        ref.read(devotionImagesProvider(devoId).future),
        ref.read(devotionReactionsProvider(devoId).future),
        ref.read(devotionReactionCountsProvider(devoId).future),
      ]).then((value) {
        final foundDevo = value[0] as Devotion;
        final foundSourceDocs = value[1] as List<SourceDocument>;
        final foundImages = value[2] as List<DevotionImage>;
        // final foundReactions = value[3] as List<DevotionReaction>;
        final foundReactionCounts = value[4] as Map<DevotionReactionType, int>;

        if (isMounted()) {
          devotion.value = foundDevo;
          sourceDocs.value = foundSourceDocs;
          images.value = foundImages;
          reactionCounts.value = foundReactionCounts;
        }
      });
    }, [ref, isMounted]);

    final refreshDevoData = useCallback(() async {
      await Future.wait([
        ref.read(singleDevotionProvider(devotion.value?.id).notifier).refresh(),
        ref.read(devotionSourceDocumentsProvider(devotion.value?.id).notifier).refresh(),
        ref.read(devotionImagesProvider(devotion.value?.id).notifier).refresh(),
        ref.read(devotionReactionsProvider(devotion.value?.id).notifier).refresh(),
        ref.read(devotionReactionCountsProvider(devotion.value?.id).notifier).refresh(),
      ]).then((value) {
        final foundDevo = value[0] as Devotion;
        final foundSourceDocs = value[1] as List<SourceDocument>;
        final foundImages = value[2] as List<DevotionImage>;
        // final foundReactions = value[3] as List<DevotionReaction>;
        final foundReactionCounts = value[4] as Map<DevotionReactionType, int>;

        if (isMounted()) {
          devotion.value = foundDevo;
          sourceDocs.value = foundSourceDocs;
          images.value = foundImages;
          reactionCounts.value = foundReactionCounts;
        }
      });
    }, [ref, isMounted]);

    useEffect(() {
      loading.value = true;
      fetchDevoData(devotionId).whenComplete(() {
        if (isMounted()) {
          loading.value = false;
          refreshDevoData();
        }
      });

      return () {};
    }, [devotionId]);

    useEffect(() {
      if (devotion.value != null) {
        Future(() {
          ref.read(currentDevotionIdProvider.notifier).updateId(devotion.value!.id);
        });
      }
      return () {};
    }, [devotion.value]);

    useEffect(() {
      advertisementLogic(ref);
      return () {};
    }, []);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: loading.value || devotion.value == null
            ? Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text("Loading Devotion"),
                  const SizedBox(
                    width: 15,
                  ),
                  SpinKitSpinningLines(
                    color: context.appBarTheme.foregroundColor ?? context.colorScheme.onBackground,
                    size: 20,
                  )
                ],
              )
            : Text(
                DateFormat.yMMMd().format(devotion.value!.date.toUtc()),
              ),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(devotionsPagesProvider.notifier).refresh();
              showModalBottomSheet(
                elevation: 20,
                isScrollControlled: true,
                context: context,
                builder: (_) => const FractionallySizedBox(
                  widthFactor: 1.0,
                  heightFactor: 0.90,
                  child: DevotionModal(),
                ),
              );
            },
            icon: const FaIcon(FontAwesomeIcons.clock),
          ),
        ],
      ),
      floatingActionButtonAnimator: FloatingActionButtonAnimator.scaling,
      floatingActionButtonLocation: FloatingActionButtonLocation.miniStartTop,
      floatingActionButton: loading.value || devotion.value == null
          ? null
          : FloatingActionButton(
              onPressed: null, // delegate to popup menu
              foregroundColor: context.colorScheme.onSecondary,
              backgroundColor: context.secondaryColor,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(
                  Radius.circular(15),
                ),
              ),
              child: PopupMenuButton(
                offset: const Offset(0, 60),
                color: context.primaryColor,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(
                    Radius.circular(15),
                  ),
                ),
                itemBuilder: (context) => [
                  PopupMenuItem(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        const Icon(Icons.thumb_up),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "${reactionCounts.value[DevotionReactionType.LIKE]}"
                          " Likes",
                          style: TextStyle(
                            color: context.colorScheme.onPrimary,
                          ),
                        ),
                      ],
                    ),
                    onTap: () async {
                      await ref
                          .read(devotionReactionsProvider(devotion.value!.id).notifier)
                          .createReaction(
                            reaction: DevotionReactionType.LIKE,
                            session: currentUser.requireValue.session,
                          )
                          .then((value) {
                        ref.read(devotionReactionCountsProvider(devotion.value!.id).notifier).refresh().then((value) {
                          if (isMounted()) {
                            reactionCounts.value[DevotionReactionType.LIKE] = value[DevotionReactionType.LIKE]!;
                          }
                        });
                      }).catchError((error, stackTrace) {
                        debugPrint("Failed to create reaction: $error $stackTrace");
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              "$error",
                              style: TextStyle(
                                color: context.colorScheme.onError,
                              ),
                            ),
                            backgroundColor: context.colorScheme.error,
                          ),
                        );
                      });
                    },
                  ),
                  PopupMenuItem(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        const Icon(Icons.thumb_down),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "${(reactionCounts.value[DevotionReactionType.DISLIKE])}"
                          " Dislikes",
                          style: TextStyle(
                            color: context.colorScheme.onPrimary,
                          ),
                        ),
                      ],
                    ),
                    onTap: () async {
                      await ref
                          .read(devotionReactionsProvider(devotion.value!.id).notifier)
                          .createReaction(
                            reaction: DevotionReactionType.DISLIKE,
                            session: currentUser.requireValue.session,
                          )
                          .then((value) {
                        ref.read(devotionReactionCountsProvider(devotion.value?.id).notifier).refresh().then((value) {
                          if (isMounted()) {
                            reactionCounts.value[DevotionReactionType.DISLIKE] = value[DevotionReactionType.DISLIKE]!;
                          }
                        });
                      }).catchError((error, stackTrace) {
                        debugPrint("Failed to create reaction: $error $stackTrace");
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              "$error",
                              style: TextStyle(
                                color: context.colorScheme.onError,
                              ),
                            ),
                            backgroundColor: context.colorScheme.error,
                          ),
                        );
                      });
                    },
                  ),
                  PopupMenuItem(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        const FaIcon(FontAwesomeIcons.shareFromSquare),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "Share",
                          style: TextStyle(
                            color: context.colorScheme.onPrimary,
                          ),
                        ),
                      ],
                    ),
                    onTap: () {
                      Share.shareUri(Uri.parse('${Website.url}/devotions/${devotion.value!.id}'));
                    },
                  ),
                ],
                icon: Icon(
                  Icons.thumbs_up_down,
                  color: context.colorScheme.onSecondary,
                ),
              ),
            ),
      body: loading.value || devotion.value == null
          ? Center(
              child: SpinKitSpinningLines(
                color: context.secondaryColor,
                size: 40,
              ),
            )
          : Container(
              padding: const EdgeInsets.only(
                left: 10,
                right: 10,
              ),
              child: RefreshIndicator(
                onRefresh: () async {
                  String? id = devotion.value?.id ?? devotionId;
                  if (id != null) {
                    return await Future.wait([
                      ref.read(singleDevotionProvider(id).notifier).refresh(),
                      ref.read(devotionSourceDocumentsProvider(id).notifier).refresh(),
                      ref.read(devotionImagesProvider(id).notifier).refresh(),
                      ref.read(devotionReactionsProvider(id).notifier).refresh(),
                      ref.read(devotionReactionCountsProvider(id).notifier).refresh(),
                    ]).then((value) {
                      final foundDevo = value[0] as Devotion;
                      final foundSourceDocs = value[1] as List<SourceDocument>;
                      final foundImages = value[2] as List<DevotionImage>;
                      // final foundReactions = value[3] as List<DevotionReaction>;
                      final foundReactionCounts = value[4] as Map<DevotionReactionType, int>;
                      if (isMounted()) {
                        devotion.value = foundDevo;
                        sourceDocs.value = foundSourceDocs;
                        images.value = foundImages;
                        reactionCounts.value = foundReactionCounts;
                      }
                    }).catchError((error, stackTrace) {
                      debugPrint("Failed to refresh devotion: $error $stackTrace");
                    });
                  }
                },
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  scrollDirection: Axis.vertical,
                  shrinkWrap: true,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 20),
                      alignment: Alignment.center,
                      child: SelectableText(
                        devotion.value!.bibleReading.split(" - ").first,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(
                      height: 5,
                    ),
                    SelectableText(
                      devotion.value!.bibleReading.split(" - ").last,
                    ),
                    Container(
                      margin: const EdgeInsets.only(
                        top: 40,
                      ),
                      alignment: Alignment.center,
                      child: const SelectableText(
                        "Summary",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    SelectableText(
                      devotion.value!.summary,
                    ),
                    Container(
                      margin: const EdgeInsets.only(
                        top: 20,
                      ),
                      alignment: Alignment.center,
                      child: const SelectableText(
                        "Reflection",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    SelectableText(
                      devotion.value!.reflection!,
                    ),
                    Container(
                      margin: const EdgeInsets.only(
                        top: 20,
                      ),
                      alignment: Alignment.center,
                      child: const SelectableText(
                        "Prayer",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    SelectableText(
                      devotion.value!.prayer!,
                    ),
                    if (images.value.isNotEmpty) ...[
                      Container(
                        margin: const EdgeInsets.only(
                          top: 20,
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          "Generated Image(s)",
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      Container(
                        margin: const EdgeInsets.only(
                          top: 10,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          images.value[0].caption ?? "No caption",
                          style: const TextStyle(
                            fontSize: 12,
                          ),
                        ),
                      ),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: images.value.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            key: ValueKey(images.value[index].id),
                            padding: const EdgeInsets.only(top: 10, bottom: 10),
                            child: RAINetworkImage(
                              imageUrl: images.value[index].url,
                              fallbackText: "Image",
                            ),
                          );
                        },
                      ),
                    ],
                    Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      child: ExpansionTile(
                        title: const Text(
                          "Sources",
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        children: [
                          ListView.builder(
                            shrinkWrap: true,
                            padding: EdgeInsets.zero,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: sourceDocs.value.length,
                            itemBuilder: (context, index) {
                              final sourceDoc = sourceDocs.value[index];
                              return Link(
                                key: ValueKey(sourceDocs.value[index].id),
                                uri: Uri.parse(
                                  sourceDocs.value[index].metadata['url'],
                                ),
                                target: LinkTarget.blank,
                                builder: (context, followLink) => ListTile(
                                  dense: true,
                                  visualDensity: RAIVisualDensity.tightest,
                                  leading: const Icon(
                                    CupertinoIcons.link,
                                    size: 15,
                                  ),
                                  title: Text(
                                    sourceDoc.name,
                                    softWrap: false,
                                    overflow: TextOverflow.fade,
                                    style: const TextStyle(
                                      fontSize: 12,
                                    ),
                                  ),
                                  subtitle: Text(
                                    sourceDoc.isWebpage
                                        ? sourceDoc.hasTitle
                                            ? sourceDoc.title
                                            : sourceDoc.url
                                        : sourceDoc.isFile
                                            ? 'P:${sourceDoc.pageNumber} L:${sourceDoc.linesFrom}-${sourceDoc.linesTo}'
                                            : sourceDoc.url,
                                    softWrap: false,
                                    overflow: TextOverflow.fade,
                                    style: const TextStyle(
                                      fontSize: 12,
                                    ),
                                  ),
                                  onTap: followLink,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
