import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/devotion/pages.dart';

class DevotionModal extends HookConsumerWidget {
  const DevotionModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devotions = ref.watch(devotionsPagesProvider);
    final devotionsNotifier = ref.watch(devotionsPagesProvider.notifier);

    ScrollController controller = useScrollController();

    useEffect(() {
      controller.addListener(() {
        if (controller.position.atEdge) {
          if (controller.position.pixels == 0) {
            // You're at the top.
          } else {
            if (devotionsNotifier.hasNextPage()) {
              devotionsNotifier.fetchNextPage();
            }
          }
        }
      });
      return () {};
    }, []);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(
              top: 10,
              bottom: 10,
              left: 30,
            ),
            decoration: ShapeDecoration(
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              color: RAIColors.primary,
            ),
            child: Row(
              children: [
                const Expanded(
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
                  icon: const Icon(
                    Icons.close,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          devotionsNotifier.isLoadingInitial()
              ? Expanded(
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: RAIColors.primary,
                      size: 32,
                    ),
                  ),
                )
              : Expanded(
                  child: ListView.builder(
                    controller: controller,
                    itemCount: devotions.requireValue
                        .expand((element) => element)
                        .toList()
                        .length,
                    itemBuilder: (context, index) {
                      final devotionsFlat = devotions.requireValue
                          .expand((element) => element)
                          .toList();
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
          devotionsNotifier.isLoadingNextPage()
              ? Container(
                  padding: const EdgeInsets.all(10),
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: RAIColors.primary,
                      size: 20,
                    ),
                  ),
                )
              : devotionsNotifier.hasNextPage()
                  ? Container(
                      padding: const EdgeInsets.all(10),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                devotionsNotifier.fetchNextPage();
                              },
                              child: const Text('Show More'),
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
