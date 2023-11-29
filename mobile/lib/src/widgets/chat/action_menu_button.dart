import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/hooks/use_chat.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/providers/chat/single.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/screens/chat/chat_modal.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/chat/create_dialog.dart';
import 'package:revelationsai/src/widgets/chat/rename_dialog.dart';

class ChatActionMenuButton extends HookConsumerWidget {
  final UseChatReturnObject chatHook;
  final ValueNotifier<Chat?> chat;
  final ValueNotifier<bool> isRefreshingChat;
  final bool Function() isMounted;
  final Future<void> Function() refreshChatData;

  const ChatActionMenuButton({
    super.key,
    required this.chatHook,
    required this.chat,
    required this.isRefreshingChat,
    required this.isMounted,
    required this.refreshChatData,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUserPreferences = ref.watch(currentUserPreferencesProvider).requireValue;

    return Container(
      padding: const EdgeInsets.all(0),
      decoration: BoxDecoration(
        color: context.secondaryColor,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: context.theme.shadowColor.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            PopupMenuButton(
              position: PopupMenuPosition.under,
              offset: const Offset(0, 10),
              constraints: BoxConstraints(
                maxWidth: context.width * 0.5,
              ),
              color: (context.brightness == Brightness.dark ? context.colorScheme.primary : Colors.grey.shade200)
                  .withOpacity(0.95),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
              onOpened: () {
                if (currentUserPreferences.hapticFeedback) HapticFeedback.mediumImpact();
              },
              itemBuilder: (context) {
                return [
                  PopupMenuItem(
                    enabled: false,
                    child: Text(
                      chat.value?.name ?? "New Chat",
                      softWrap: true,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: context.colorScheme.onBackground,
                      ),
                    ),
                  ),
                  PopupMenuItem(
                    enabled: false,
                    height: double.minPositive,
                    child: Divider(
                      color: context.colorScheme.onBackground,
                    ),
                  ),
                  PopupMenuItem(
                    onTap: () async {
                      if (chatHook.chatId.value != null) {
                        isRefreshingChat.value = true;
                        return await refreshChatData().catchError((error) {
                          debugPrint("Failed to refresh chat: $error");
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                "Failed to refresh chat: $error",
                                style: TextStyle(
                                  color: context.colorScheme.onError,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                              backgroundColor: context.colorScheme.error,
                            ),
                          );
                          ref.read(currentChatIdProvider.notifier).update(null);
                          context.go("/chat");
                        }).whenComplete(() {
                          if (isMounted()) isRefreshingChat.value = false;
                        });
                      }
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Icon(
                          CupertinoIcons.arrow_2_circlepath,
                          color: context.colorScheme.onBackground,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "Refresh",
                          style: TextStyle(
                            color: context.colorScheme.onBackground,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    onTap: () {
                      ref.read(chatsPagesProvider.notifier).refresh();
                      showModalBottomSheet(
                        elevation: 20,
                        isScrollControlled: true,
                        context: context,
                        builder: (_) => const FractionallySizedBox(
                          widthFactor: 1.0,
                          heightFactor: 0.90,
                          child: ChatModal(),
                        ),
                      );
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Icon(
                          CupertinoIcons.clock,
                          color: context.colorScheme.onBackground,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "History",
                          style: TextStyle(
                            color: context.colorScheme.onBackground,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    onTap: () async {
                      showDialog(
                        barrierDismissible: false,
                        context: context,
                        builder: (context) {
                          return const CreateDialog();
                        },
                      );
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Icon(
                          CupertinoIcons.add,
                          color: context.colorScheme.onBackground,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "New Chat",
                          style: TextStyle(
                            color: context.colorScheme.onBackground,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    onTap: () {
                      if (chatHook.chatId.value != null) {
                        showDialog(
                          barrierDismissible: false,
                          context: context,
                          builder: (context) {
                            return RenameDialog(
                              id: chatHook.chatId.value!,
                              name: chat.value!.name,
                            );
                          },
                        ).then((_) async {
                          await ref.read(singleChatProvider(chatHook.chatId.value).notifier).refresh().then((value) {
                            chat.value = value;
                          });
                        });
                      }
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Icon(
                          CupertinoIcons.pencil,
                          color: context.colorScheme.onBackground,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          "Rename Chat",
                          style: TextStyle(
                            color: context.colorScheme.onBackground,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    onTap: () async {
                      if (chatHook.chatId.value != null) {
                        ref.read(singleChatProvider(chatHook.chatId.value).notifier).deleteChat().catchError(
                          (error) {
                            debugPrint("Failed to delete chat: $error");
                          },
                        );
                        ref.read(currentChatIdProvider.notifier).update(null);
                        context.go("/chat");
                      }
                    },
                    child: const Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Icon(
                          CupertinoIcons.trash,
                          color: Colors.red,
                        ),
                        SizedBox(
                          width: 10,
                        ),
                        Text(
                          "Delete Chat",
                          style: TextStyle(color: Colors.red),
                        ),
                      ],
                    ),
                  ),
                ];
              },
              icon: Icon(
                Icons.more_vert,
                color: context.colorScheme.onSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
