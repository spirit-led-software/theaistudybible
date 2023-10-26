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
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/providers/devotion/data.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/reaction_count.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/screens/devotion/devotion_modal.dart';
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
    final devotionDataManager = ref.watch(devotionDataManagerProvider);

    final isMounted = useIsMounted();
    final loading = useState(false);
    final devotion = useState<Devotion?>(null);
    final sourceDocs = useState<List<SourceDocument>>([]);
    final images = useState<List<DevotionImage>>([]);
    final reactionCounts = useState<Map<DevotionReactionType, int>>({});

    final fetchDevoData = useCallback((String? id) async {
      var devoId = id ?? await ref.refresh(devotionsPagesProvider.future).then((value) => value.first.first.id);

      await Future.wait([
        ref.refresh(devotionsProvider(devoId!).future),
        ref.refresh(devotionSourceDocumentsProvider(devoId).future),
        ref.refresh(devotionImagesProvider(devoId).future),
        ref.refresh(devotionReactionsProvider(devoId).future),
        ref.refresh(devotionReactionCountsProvider(devoId).future),
      ]).then((value) {
        final foundDevo = value[0] as Devotion;
        final foundSourceDocs = value[1] as List<SourceDocument>;
        final foundImages = value[2] as List<DevotionImage>;
        final foundReactions = value[3] as List<DevotionReaction>;
        final foundReactionCounts = value[4] as Map<DevotionReactionType, int>;

        if (isMounted()) {
          devotion.value = foundDevo;
          sourceDocs.value = foundSourceDocs;
          images.value = foundImages;
          reactionCounts.value = foundReactionCounts;
        }

        devotionDataManager.value?.addDevotion(
          DevotionData(
            id: foundDevo.id,
            devotion: foundDevo.toEmbedded(),
            images: foundImages.map((e) => e.toEmbedded()).toList(),
            sourceDocuments: foundSourceDocs.map((e) => e.toEmbedded()).toList(),
            reactions: foundReactions.map((e) => e.toEmbedded()).toList(),
            reactionCounts: foundReactionCounts.entries
                .map((e) => EmbeddedReactionCounts(
                      type: e.key,
                      count: e.value,
                    ))
                .toList(),
          ),
        );
      });
    }, [ref, isMounted]);

    useEffect(() {
      final id = devotionId ?? ref.read(devotionsPagesProvider).value?.firstOrNull?.firstOrNull?.id;
      if (devotionDataManager.hasValue) {
        devotionDataManager.value!.hasDevotion(id!).then((value) async {
          if (value) {
            if (isMounted()) {
              final devoData = await devotionDataManager.value!.getDevotion(id);
              devotion.value = devoData!.devotion.toRegular();
              images.value = devoData.images.map((e) => e.toRegular()).toList();
              sourceDocs.value = devoData.sourceDocuments.map((e) => e.toRegular()).toList();
              reactionCounts.value = {for (final e in devoData.reactionCounts) e.type: e.count!};
            }
          } else {
            loading.value = true;
            fetchDevoData(id).whenComplete(() {
              if (isMounted()) loading.value = false;
            });
          }
        });
      } else {
        loading.value = true;
        fetchDevoData(id).whenComplete(() {
          if (isMounted()) loading.value = false;
        });
      }

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
                    onTap: () {
                      ref
                          .read(devotionReactionsProvider(devotion.value!.id).notifier)
                          .createReaction(
                            reaction: DevotionReactionType.LIKE,
                            session: currentUser.requireValue.session,
                          )
                          .then((value) {
                        ref.refresh(devotionReactionCountsProvider(devotion.value!.id).future).then((value) {
                          if (isMounted()) {
                            reactionCounts.value[DevotionReactionType.LIKE] = value[DevotionReactionType.LIKE]!;
                          }
                        });
                      }).catchError((error) {
                        debugPrint("Failed to create reaction: $error");
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
                    onTap: () {
                      ref
                          .read(devotionReactionsProvider(devotion.value!.id).notifier)
                          .createReaction(
                            reaction: DevotionReactionType.DISLIKE,
                            session: currentUser.requireValue.session,
                          )
                          .then((value) {
                        ref.refresh(devotionReactionCountsProvider(devotion.value!.id).future).then((value) {
                          if (isMounted()) {
                            reactionCounts.value[DevotionReactionType.DISLIKE] = value[DevotionReactionType.DISLIKE]!;
                          }
                        });
                      }).catchError((error) {
                        debugPrint("Failed to create reaction: $error");
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
                      ref.refresh(devotionsProvider(id).future),
                      ref.refresh(devotionSourceDocumentsProvider(id).future),
                      ref.refresh(devotionImagesProvider(id).future),
                      ref.refresh(devotionReactionsProvider(id).future),
                      ref.refresh(devotionReactionCountsProvider(id).future),
                    ]).then((value) {
                      final foundDevo = value[0] as Devotion;
                      final foundSourceDocs = value[1] as List<SourceDocument>;
                      final foundImages = value[2] as List<DevotionImage>;
                      final foundReactions = value[3] as List<DevotionReaction>;
                      final foundReactionCounts = value[4] as Map<DevotionReactionType, int>;
                      if (isMounted()) {
                        devotion.value = foundDevo;
                        sourceDocs.value = foundSourceDocs;
                        images.value = foundImages;
                        reactionCounts.value = foundReactionCounts;
                      }
                      devotionDataManager.value?.addDevotion(
                        DevotionData(
                          id: foundDevo.id,
                          devotion: foundDevo.toEmbedded(),
                          images: foundImages.map((e) => e.toEmbedded()).toList(),
                          sourceDocuments: foundSourceDocs.map((e) => e.toEmbedded()).toList(),
                          reactions: foundReactions.map((e) => e.toEmbedded()).toList(),
                          reactionCounts: foundReactionCounts.entries
                              .map((e) => EmbeddedReactionCounts(
                                    type: e.key,
                                    count: e.value,
                                  ))
                              .toList(),
                        ),
                      );
                    }).catchError((error) {
                      debugPrint("Failed to refresh devotion: $error");
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
                                    sourceDocs.value[index].metadata['name'].split(" - ").first.toString(),
                                    softWrap: false,
                                    overflow: TextOverflow.fade,
                                    style: const TextStyle(
                                      fontSize: 12,
                                    ),
                                  ),
                                  subtitle: Text(
                                    sourceDocs.value[index].metadata['url'].toString(),
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
