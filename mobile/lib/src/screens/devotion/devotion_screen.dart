import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/screens/devotion/devotion_modal.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:url_launcher/link.dart';

class DevotionScreen extends HookConsumerWidget {
  final String? devotionId;

  const DevotionScreen({
    super.key,
    this.devotionId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<Devotion?> devotion = useState(null);
    ValueNotifier<List<SourceDocument>> sourceDocs = useState([]);
    ValueNotifier<List<DevotionImage>> images = useState([]);

    useEffect(() {
      loading.value = true;
      if (devotionId != null) {
        Future devoFuture =
            DevotionService.getDevotion(id: devotionId!).then((value) {
          devotion.value = value;
        });

        Future devoSourceDocsFuture =
            DevotionService.getDevotionSourceDocuments(id: devotionId!).then(
          (value) {
            sourceDocs.value = value;
          },
        );

        Future devoImagesFuture =
            DevotionImageService.getDevotionImages(id: devotionId!)
                .then((value) {
          images.value = value.entities;
        });

        Future.wait([devoFuture, devoSourceDocsFuture, devoImagesFuture])
            .whenComplete(() => loading.value = false);
      } else {
        Future devoFuture = DevotionService.getDevotions(
                paginationOptions:
                    const PaginatedEntitiesRequestOptions(limit: 1))
            .then(
          (value) {
            devotion.value = value.entities.first;
            Future devoSourceDocFuture =
                DevotionService.getDevotionSourceDocuments(
                        id: value.entities.first.id)
                    .then((value) {
              sourceDocs.value = value;
            });
            Future devoImagesFuture = DevotionImageService.getDevotionImages(
                    id: value.entities.first.id)
                .then((value) {
              images.value = value.entities;
            });
            return Future.wait([devoSourceDocFuture, devoImagesFuture]);
          },
        );
        Future.wait([devoFuture]).whenComplete(() => loading.value = false);
      }

      return () {};
    }, [devotionId]);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
        title: Text(loading.value
            ? "Devotions"
            : DateFormat.yMMMd().format(devotion.value!.date)),
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
            icon: Icon(Icons.more_vert),
          ),
        ],
      ),
      body: loading.value
          ? Center(
              child: CircularProgressIndicator(
                color: RAIColors.primary,
              ),
            )
          : Container(
              padding: EdgeInsets.all(10),
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
                  SizedBox(
                    height: 5,
                  ),
                  Text(
                    devotion.value!.bibleReading.split(" - ").last,
                  ),
                  const SizedBox(
                    height: 40,
                  ),
                  Container(
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
                  const SizedBox(
                    height: 20,
                  ),
                  Container(
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
                  const SizedBox(
                    height: 20,
                  ),
                  Container(
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
                  const SizedBox(
                    height: 20,
                  ),
                  Container(
                    alignment: Alignment.center,
                    child: const Text(
                      "Generated Image(s)",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
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
                  const SizedBox(
                    height: 20,
                  ),
                  Container(
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
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: sourceDocs.value.length,
                    itemBuilder: (context, index) {
                      return Link(
                        uri: Uri.parse(
                          sourceDocs.value[index].metadata!['url'],
                        ),
                        target: LinkTarget.blank,
                        builder: (context, followLink) => ListTile(
                          title: Text(
                            sourceDocs.value[index].metadata!['name'],
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          onTap: followLink,
                          dense: true,
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
