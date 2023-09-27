import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/providers/devotion/data.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:revelationsai/src/screens/devotion/devotion_modal.dart';
import 'package:url_launcher/link.dart';

class DevotionScreen extends HookConsumerWidget {
  final String? devotionId;

  const DevotionScreen({
    super.key,
    this.devotionId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
          ]).then((value) {
            final foundDevo = value[0] as Devotion;
            final foundSourceDocs = value[1] as List<SourceDocument>;
            final foundImages = value[2] as List<DevotionImage>;

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
                  ),
                );
          }).whenComplete(() {
            if (isMounted()) loading.value = false;
          });
        } else {
          ref.read(devotionsPagesProvider.future).then((value) {
            final foundDevo = value.first.first;
            final foundSourceDocs = <SourceDocument>[];
            final foundImages = <DevotionImage>[];

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
                  ),
                );
          }).whenComplete(() {
            if (isMounted()) loading.value = false;
          });
        }
      }

      return () {};
    }, [devotionId]);

    useEffect(() {
      if (devotion.value != null) {
        Future(() {
          ref
              .read(currentDevotionIdProvider.notifier)
              .update(devotion.value!.id);
        });
      }

      return () {};
    }, [devotion.value]);

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
            icon: const Icon(Icons.more_vert),
          ),
        ],
      ),
      body: loading.value
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
                          padding: const EdgeInsets.only(top: 10, bottom: 10),
                          child: Image.network(images.value[index].url),
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
