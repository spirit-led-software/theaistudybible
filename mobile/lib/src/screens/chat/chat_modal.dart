import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/services/chat.dart';

class ChatModal extends HookConsumerWidget {
  const ChatModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    ScrollController controller = useScrollController();
    ValueNotifier<bool> loading = useState(false);
    ValueNotifier<int> page = useState(1);
    ValueNotifier<List<List<Chat>>> chats = useState([]);
    ValueNotifier<bool> hasMore = useState(false);

    useEffect(() {
      loading.value = true;
      Future<void> chatFuture = ChatService.getChats(
        session: currentUser.requireValue!.session,
        paginationOptions:
            PaginatedEntitiesRequestOptions(limit: 7, page: page.value),
      ).then(
        (value) {
          chats.value.add(value.entities);
          hasMore.value = value.entities.length == 7;
        },
      );

      Future.wait([chatFuture]).whenComplete(() {
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
                    'All chats',
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
          loading.value && chats.value.isEmpty
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
                    itemCount: chats.value
                        .expand((element) => element)
                        .toList()
                        .length,
                    itemBuilder: (context, index) {
                      final chatsFlat =
                          chats.value.expand((element) => element).toList();
                      return ListTile(
                        title: Text(
                          chatsFlat[index].name,
                        ),
                        subtitle: Text(
                          DateFormat.yMMMd().format(chatsFlat[index].createdAt),
                        ),
                        onTap: () {
                          context.go(
                            '/chat/${chatsFlat[index].id}',
                          );
                          Navigator.of(context).pop();
                        },
                      );
                    },
                  ),
                ),
          loading.value && chats.value.isNotEmpty
              ? Container(
                  padding: const EdgeInsets.all(10),
                  child: Center(
                    child: CircularProgressIndicator(
                      color: RAIColors.primary,
                    ),
                  ),
                )
              : hasMore.value
                  ? Container(
                      padding: const EdgeInsets.all(10),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                page.value += 1;
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
