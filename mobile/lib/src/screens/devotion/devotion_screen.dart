import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_app_badger/flutter_app_badger.dart';
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
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:revelationsai/src/providers/devotion/single.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/screens/devotion/devotion_modal.dart';
import 'package:revelationsai/src/utils/advertisement.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/utils/capitalization.dart';
import 'package:revelationsai/src/widgets/network_image.dart';
import 'package:revelationsai/src/widgets/refresh_indicator.dart';
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
    final currentUserPrefs = ref.watch(currentUserPreferencesProvider).requireValue;

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
      debugPrint("DevotionScreen: useEffect: devotionId: $devotionId");
      loading.value = true;
      fetchDevoData(devotionId).whenComplete(() async {
        if (isMounted()) {
          loading.value = false;
          await Future(() => refreshDevoData());
        }
      }).whenComplete(() async => await showAdvertisementLogic(ref));
      return () {};
    }, [devotionId]);

    useEffect(() {
      final devo = devotion.value;
      if (devo != null) {
        Future(() {
          ref.read(currentDevotionIdProvider.notifier).updateId(devo.id);
        });
        ref.devotions.getLatest().then((value) {
          if (value.id == devo.id) {
            debugPrint("DevotionScreen: useEffect: User is viewing latest devo, resetting badge count");
            FlutterAppBadger.isAppBadgeSupported().then((value) {
              if (value) {
                FlutterAppBadger.updateBadgeCount(0);
              }
            });
          }
        });
      }
      return () {};
    }, [devotion.value]);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        centerTitle: true,
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
            : Column(
                children: [
                  Text(
                    devotion.value!.topic.toTitleCase(),
                  ),
                  Text(
                    DateFormat.yMd().format(devotion.value!.date.toUtc()),
                    style: context.textTheme.labelLarge?.copyWith(
                      color: context.colorScheme.onPrimary,
                    ),
                  ),
                ],
              ),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(devotionsPagesProvider.notifier).refresh();
              if (currentUserPrefs.hapticFeedback) {
                HapticFeedback.mediumImpact();
              }
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
                color: context.brightness == Brightness.light ? Colors.grey.shade200 : context.colorScheme.primary,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(
                    Radius.circular(15),
                  ),
                ),
                onOpened: () {
                  if (currentUserPrefs.hapticFeedback) {
                    HapticFeedback.mediumImpact();
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.thumb_up,
                          color: context.colorScheme.onBackground,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "${reactionCounts.value[DevotionReactionType.LIKE]}"
                          " Likes",
                          style: TextStyle(
                            color: context.colorScheme.onBackground,
                          ),
                        ),
                      ],
                    ),
                    onTap: () async {
                      await ref
                          .read(devotionReactionsProvider(devotion.value!.id).notifier)
                          .createReaction(
                            reactionType: DevotionReactionType.LIKE,
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
                        Icon(
                          Icons.thumb_down,
                          color: context.colorScheme.onBackground,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "${(reactionCounts.value[DevotionReactionType.DISLIKE])}"
                          " Dislikes",
                          style: TextStyle(
                            color: context.colorScheme.onBackground,
                          ),
                        ),
                      ],
                    ),
                    onTap: () async {
                      await ref
                          .read(devotionReactionsProvider(devotion.value!.id).notifier)
                          .createReaction(
                            reactionType: DevotionReactionType.DISLIKE,
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
                        Icon(
                          CupertinoIcons.share_up,
                          color: context.colorScheme.onBackground,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "Share",
                          style: TextStyle(
                            color: context.colorScheme.onBackground,
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
              child: RAIRefreshIndicator(
                onRefresh: () async {
                  await refreshDevoData();
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
                      margin: const EdgeInsets.only(top: 20),
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
                      margin: const EdgeInsets.only(top: 20),
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
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 10,
                        runSpacing: 10,
                        children: images.value
                            .map(
                              (e) => RAINetworkImage(
                                imageUrl: e.url,
                                fallbackText: "Image",
                              ),
                            )
                            .toList(),
                      )
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
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 12,
                                    ),
                                  ),
                                  subtitle: Text(
                                    sourceDoc.isWebpage
                                        ? sourceDoc.hasTitle
                                            ? sourceDoc.title!
                                            : sourceDoc.url
                                        : sourceDoc.isFile
                                            ? 'Page(s): ${sourceDoc.pageNumbers?.keys.join(", ")}'
                                            : sourceDoc.url,
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 2,
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
