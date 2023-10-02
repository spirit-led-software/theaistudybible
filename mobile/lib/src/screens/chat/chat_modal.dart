import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/widgets/chat/create_dialog.dart';
import 'package:revelationsai/src/widgets/chat/edit_dialog.dart';

class ChatModal extends HookConsumerWidget {
  const ChatModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chats = ref.watch(chatsPagesProvider);
    final chatsNotifier = ref.watch(chatsPagesProvider.notifier);

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
          if (!chatsNotifier.isLoadingInitial())
            Container(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) {
                            return const CreateDialog();
                          },
                        );
                      },
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text('New Chat'),
                          SizedBox(
                            width: 10,
                          ),
                          Icon(Icons.add),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          chatsNotifier.isLoadingInitial()
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
                    itemCount: chats.requireValue
                        .expand((element) => element)
                        .toList()
                        .length,
                    itemBuilder: (context, index) {
                      final chatsFlat = chats.requireValue
                          .expand((element) => element)
                          .toList();
                      return ListTile(
                        title: Text(
                          chatsFlat[index].name,
                          softWrap: false,
                          overflow: TextOverflow.fade,
                        ),
                        subtitle: Text(
                          DateFormat.yMMMd().format(chatsFlat[index].createdAt),
                        ),
                        dense: true,
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              visualDensity: const VisualDensity(
                                horizontal: VisualDensity.minimumDensity,
                                vertical: VisualDensity.minimumDensity,
                              ),
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (context) {
                                    return EditDialog(
                                      id: chatsFlat[index].id,
                                      name: chatsFlat[index].name,
                                    );
                                  },
                                );
                              },
                              icon: const Icon(Icons.edit),
                            ),
                            IconButton(
                              visualDensity: const VisualDensity(
                                horizontal: VisualDensity.minimumDensity,
                                vertical: VisualDensity.minimumDensity,
                              ),
                              onPressed: () {
                                chatsNotifier.deleteChat(chatsFlat[index].id);
                              },
                              icon: const Icon(Icons.delete),
                            )
                          ],
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
          chatsNotifier.isLoadingNextPage()
              ? Container(
                  padding: const EdgeInsets.all(10),
                  child: Center(
                    child: SpinKitSpinningLines(
                      color: RAIColors.primary,
                      size: 20,
                    ),
                  ),
                )
              : chatsNotifier.hasNextPage()
                  ? Container(
                      padding: const EdgeInsets.all(10),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                chatsNotifier.fetchNextPage();
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
