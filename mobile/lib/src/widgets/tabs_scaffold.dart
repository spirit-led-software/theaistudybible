import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';

class TabsScaffold extends HookConsumerWidget {
  final Widget child;

  const TabsScaffold({Key? key, required this.child}) : super(key: key);

  int _calculateCurrentIndex(context) {
    String path = GoRouter.of(context).routeInformationProvider.value.uri.path;

    if (path.startsWith("/chat")) {
      return 0;
    } else if (path.startsWith("/devotions")) {
      return 1;
    } else if (path.startsWith("/account") || path.startsWith("/upgrade")) {
      return 2;
    } else {
      return 0;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUserPrefs = ref.watch(currentUserPreferencesProvider);
    bool hapticFeedbackEnabled = currentUserPrefs.requireValue.hapticFeedback;

    return Scaffold(
      body: child,
      bottomNavigationBar: Theme(
        data: ThemeData(
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
        ),
        child: BottomNavigationBar(
          enableFeedback: hapticFeedbackEnabled,
          elevation: 10,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(CupertinoIcons.chat_bubble_fill),
              label: "Chat",
            ),
            BottomNavigationBarItem(
              icon: Icon(CupertinoIcons.book_fill),
              label: "Devotions",
            ),
            BottomNavigationBarItem(
              icon: Icon(CupertinoIcons.person_fill),
              label: "Account",
            ),
          ],
          backgroundColor: RAIColors.primary,
          selectedItemColor: RAIColors.secondary,
          unselectedItemColor: Colors.white,
          currentIndex: _calculateCurrentIndex(context),
          onTap: (value) {
            switch (value) {
              case 0:
                context.go("/chat");
                break;
              case 1:
                context.go("/devotions");
                break;
              case 2:
                context.go("/account");
                break;
              default:
                context.go("/chat");
                break;
            }
          },
        ),
      ),
    );
  }
}
