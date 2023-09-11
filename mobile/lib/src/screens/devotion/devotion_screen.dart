import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
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
    final isMounted = useIsMounted();
    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<Devotion?> devotion = useState(null);
    ValueNotifier<List<SourceDocument>> sourceDocs = useState([]);
    ValueNotifier<List<DevotionImage>> images = useState([]);

    useEffect(() {
      loading.value = true;
      if (devotionId != null) {
        Future devoFuture =
            ref.read(currentDevotionProvider(devotionId!).future).then((value) {
          if (isMounted()) devotion.value = value;
        });
        Future devoSourceDocsFuture = ref
            .read(devotionSourceDocumentsProvider(devotionId!).future)
            .then((value) {
          if (isMounted()) sourceDocs.value = value;
        });
        Future devoImagesFuture =
            ref.read(devotionImagesProvider(devotionId!).future).then((value) {
          if (isMounted()) images.value = value;
        });
        Future.wait([devoFuture, devoSourceDocsFuture, devoImagesFuture])
            .whenComplete(() {
          if (isMounted()) loading.value = false;
        });
      } else {
        DevotionService.getDevotions(
                paginationOptions:
                    const PaginatedEntitiesRequestOptions(limit: 1))
            .then(
          (value) {
            if (isMounted()) {
              devotion.value = value.entities.first;
              Future devoSourceDocFuture = ref
                  .read(devotionSourceDocumentsProvider(value.entities.first.id)
                      .future)
                  .then((value) {
                if (isMounted()) sourceDocs.value = value;
              });
              Future devoImagesFuture = ref
                  .read(devotionImagesProvider(value.entities.first.id).future)
                  .then((value) {
                if (isMounted()) images.value = value;
              });
              return Future.wait([devoSourceDocFuture, devoImagesFuture]);
            }
            return Future.value();
          },
        ).whenComplete(() {
          if (isMounted()) loading.value = false;
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
