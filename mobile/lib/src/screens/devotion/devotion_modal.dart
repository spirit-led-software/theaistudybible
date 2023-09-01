import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/services/devotion.dart';

class DevotionModal extends HookConsumerWidget {
  const DevotionModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ScrollController controller = useScrollController();
    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<int> page = useState(1);
    ValueNotifier<List<List<Devotion>>> devotions = useState([]);
    ValueNotifier<bool> hasMore = useState(false);

    useEffect(() {
      loading.value = true;
      Future<void> devotionFuture = DevotionService.getDevotions(
        paginationOptions:
            PaginatedEntitiesRequestOptions(limit: 7, page: page.value),
      ).then(
        (value) {
          devotions.value.add(value.entities);
          hasMore.value = value.entities.length == 7;
        },
      );

      Future.wait([devotionFuture]).whenComplete(() {
        loading.value = false;
      });

      return () {};
    }, [page.value]);

    useEffect(() {
      controller.addListener(() {
        if (controller.position.atEdge) {
          if (controller.position.pixels == 0) {
            // You're at the top.
          } else {
            if (hasMore.value) {
              page.value += 1;
            }
          }
        }
      });
      return () {};
    }, []);

    return Container(
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.only(
              top: 10,
              bottom: 10,
              left: 30,
            ),
            decoration: ShapeDecoration(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              color: RAIColors.primary,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'All Devotions',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: Icon(
                    Icons.close,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          loading.value && devotions.value.isEmpty
              ? Expanded(
                  child: Center(
                    child: CircularProgressIndicator(
                      color: RAIColors.primary,
                    ),
                  ),
                )
              : Expanded(
                  child: ListView.builder(
                    controller: controller,
                    itemCount: devotions.value
                        .expand((element) => element)
                        .toList()
                        .length,
                    itemBuilder: (context, index) {
                      final devotionsFlat =
                          devotions.value.expand((element) => element).toList();
                      return ListTile(
                        title: Text(DateFormat.yMMMd()
                            .format(devotionsFlat[index].date)),
                        subtitle: Text(
                          devotionsFlat[index].bibleReading.split(" - ").first,
                        ),
                        onTap: () {
                          context.go(
                            '/devotions/${devotionsFlat[index].id}',
                          );
                          Navigator.of(context).pop();
                        },
                      );
                    },
                  ),
                ),
          loading.value && devotions.value.isNotEmpty
              ? Container(
                  padding: EdgeInsets.all(10),
                  child: Center(
                    child: CircularProgressIndicator(
                      color: RAIColors.primary,
                    ),
                  ),
                )
              : hasMore.value
                  ? Container(
                      padding: EdgeInsets.all(10),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                page.value += 1;
                              },
                              child: Text('Show More'),
                            ),
                          ),
                        ],
                      ),
                    )
                  : Container(),
        ],
      ),
    );
  }
}
