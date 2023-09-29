import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
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
import 'package:revelationsai/src/widgets/network_image.dart';
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
    final loadedDevotions = ref.watch(loadedDevotionDataProvider);

    final isMounted = useIsMounted();
    final loading = useState(false);
    final devotion = useState<Devotion?>(null);
    final sourceDocs = useState<List<SourceDocument>>([]);
    final images = useState<List<DevotionImage>>([]);

    useEffect(() {
      if (loadedDevotions.value?.containsKey(devotionId) ?? false) {
        if (isMounted()) {
          final devoData = loadedDevotions.value![devotionId];
          devotion.value = devoData!.devotion;
          images.value = devoData.images;
          sourceDocs.value = devoData.sourceDocuments;
        }
      } else {
        loading.value = true;
        if (devotionId != null) {
          Future.wait([
            ref.read(devotionByIdProvider(devotionId!).future),
            ref.read(devotionSourceDocumentsProvider(devotionId!).future),
            ref.read(devotionImagesProvider(devotionId!).future),
            ref.read(devotionReactionsProvider(devotionId!).future),
            ref.read(devotionReactionCountsProvider(devotionId!).future),
          ]).then((value) {
            final foundDevo = value[0] as Devotion;
            final foundSourceDocs = value[1] as List<SourceDocument>;
            final foundImages = value[2] as List<DevotionImage>;
            final foundReactions = value[3] as List<DevotionReaction>;
            final foundReactionCounts =
                value[4] as Map<DevotionReactionType, int>;

            if (isMounted()) {
              devotion.value = foundDevo;
              sourceDocs.value = foundSourceDocs;
              images.value = foundImages;
            }

            ref.read(loadedDevotionDataProvider.notifier).addDevotion(
                  DevotionData(
                    devotion: foundDevo,
                    images: foundImages,
                    sourceDocuments: foundSourceDocs,
                    reactions: foundReactions,
                    reactionCounts: foundReactionCounts,
                  ),
                );
          }).whenComplete(() {
            if (isMounted()) loading.value = false;
          });
        } else {
          ref.read(devotionsPagesProvider.future).then((value) async {
            final foundDevo = value.first.first;

            List<DevotionImage> foundImages;
            List<SourceDocument> foundSourceDocs;
            List<DevotionReaction> foundReactions;
            Map<DevotionReactionType, int> foundReactionCounts;
            if (loadedDevotions.value?.containsKey(foundDevo.id) ?? false) {
              foundImages = loadedDevotions.value![foundDevo.id]!.images;
              foundSourceDocs =
                  loadedDevotions.value![foundDevo.id]!.sourceDocuments;
              foundReactions = loadedDevotions.value![foundDevo.id]!.reactions;
              foundReactionCounts =
                  loadedDevotions.value![foundDevo.id]!.reactionCounts;
            } else {
              final foundDevoData = await Future.wait([
                ref.read(devotionImagesProvider(foundDevo.id).future),
                ref.read(devotionSourceDocumentsProvider(foundDevo.id).future),
                ref.read(devotionReactionsProvider(foundDevo.id).future),
                ref.read(devotionReactionCountsProvider(foundDevo.id).future),
              ]);
              foundImages = foundDevoData[0] as List<DevotionImage>;
              foundSourceDocs = foundDevoData[1] as List<SourceDocument>;
              foundReactions = foundDevoData[2] as List<DevotionReaction>;
              foundReactionCounts =
                  foundDevoData[3] as Map<DevotionReactionType, int>;

              ref.read(loadedDevotionDataProvider.notifier).addDevotion(
                    DevotionData(
                      devotion: foundDevo,
                      images: foundImages,
                      sourceDocuments: foundSourceDocs,
                      reactions: foundReactions,
                      reactionCounts: foundReactionCounts,
                    ),
                  );
            }

            if (isMounted()) {
              devotion.value = foundDevo;
              images.value = foundImages;
              sourceDocs.value = foundSourceDocs;
            }
          }).whenComplete(() {
            if (isMounted()) loading.value = false;
          });
        }
      }

      if (devotionId != null) {
        Future(() {
          ref.read(currentDevotionIdProvider.notifier).update(devotionId);
        });
      }

      return () {};
    }, [devotionId]);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
        title: loading.value || devotion.value == null
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("Loading Devotion"),
                  SizedBox(
                    width: 15,
                  ),
                  SpinKitSpinningLines(
                    color: Colors.white,
                    size: 20,
                  )
                ],
              )
            : Text(
                DateFormat.yMMMd().format(devotion.value!.date),
              ),
        actions: [
          IconButton(
            onPressed: () {
              showModalBottomSheet(
                elevation: 20,
                isScrollControlled: true,
                context: context,
                backgroundColor: Colors.white,
                builder: (_) => const FractionallySizedBox(
                  heightFactor: 0.90,
                  child: DevotionModal(),
                ),
              );
            },
            icon: const FaIcon(FontAwesomeIcons.clock),
          ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.miniEndFloat,
      floatingActionButton: loading.value || devotion.value == null
          ? null
          : FloatingActionButton(
              foregroundColor: RAIColors.primary,
              backgroundColor: Colors.white.withOpacity(0.9),
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(
                  Radius.circular(15),
                ),
                side: BorderSide(
                  width: 1,
                ),
              ),
              child: const Icon(Icons.thumbs_up_down),
              onPressed: () {
                // Show dropdown of reactions
                showMenu(
                  color: Colors.white,
                  context: context,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  position: RelativeRect.fromLTRB(
                    MediaQuery.of(context).size.width,
                    MediaQuery.of(context).size.height - 275,
                    0,
                    0,
                  ),
                  items: [
                    PopupMenuItem(
                      child: Row(
                        children: [
                          const Icon(Icons.thumb_up),
                          const SizedBox(
                            width: 10,
                          ),
                          Text(ref
                                  .watch(devotionReactionCountsProvider(
                                      devotion.value!.id))
                                  .value?[DevotionReactionType.LIKE]
                                  .toString() ??
                              '0'),
                        ],
                      ),
                      onTap: () {
                        ref
                            .read(devotionReactionsProvider(devotion.value!.id)
                                .notifier)
                            .createReaction(
                              reaction: DevotionReactionType.LIKE,
                              session: currentUser.requireValue.session,
                            );
                      },
                    ),
                    PopupMenuItem(
                      child: Row(
                        children: [
                          const Icon(Icons.thumb_down),
                          const SizedBox(
                            width: 10,
                          ),
                          Text(ref
                                  .watch(
                                    devotionReactionCountsProvider(
                                        devotion.value!.id),
                                  )
                                  .value?[DevotionReactionType.DISLIKE]
                                  .toString() ??
                              '0'),
                        ],
                      ),
                      onTap: () {
                        ref
                            .read(devotionReactionsProvider(devotion.value!.id)
                                .notifier)
                            .createReaction(
                              reaction: DevotionReactionType.DISLIKE,
                              session: currentUser.requireValue.session,
                            );
                      },
                    ),
                  ],
                );
              },
            ),
      body: loading.value || devotion.value == null
          ? Center(
              child: SpinKitSpinningLines(
                color: RAIColors.primary,
                size: 40,
              ),
            )
          : Container(
              padding: const EdgeInsets.all(10),
              child: ListView(
                children: [
                  Container(
                    alignment: Alignment.center,
                    child: Text(
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
                  Text(
                    devotion.value!.bibleReading.split(" - ").last,
                  ),
                  Container(
                    margin: const EdgeInsets.only(
                      top: 40,
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      "Summary",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Text(
                    devotion.value!.summary,
                  ),
                  Container(
                    margin: const EdgeInsets.only(
                      top: 20,
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      "Reflection",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Text(
                    devotion.value!.reflection!,
                  ),
                  Container(
                    margin: const EdgeInsets.only(
                      top: 20,
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      "Prayer",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Text(
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
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
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
                    margin: const EdgeInsets.only(
                      top: 20,
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      "Sources",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
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
                        target: LinkTarget.self,
                        builder: (context, followLink) => ListTile(
                          dense: true,
                          visualDensity: RAIVisualDensity.tightest,
                          leading: Icon(
                            Icons.link,
                            size: 15,
                            color: Colors.grey.shade600,
                          ),
                          title: Text(
                            sourceDocs.value[index].metadata['name'],
                            softWrap: false,
                            overflow: TextOverflow.fade,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
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
    );
  }
}
