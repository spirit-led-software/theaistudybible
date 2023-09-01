import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:revelationsai/src/constants/Colors.dart';

class TabsScaffold extends HookWidget {
  final Widget child;

  const TabsScaffold({Key? key, required this.child}) : super(key: key);

  int _calculateCurrentIndex(context) {
    String path = GoRouter.of(context).routeInformationProvider.value.uri.path;

    if (path.startsWith("/chat")) {
      return 0;
    } else if (path.startsWith("/devotions")) {
      return 1;
    } else if (path.startsWith("/account")) {
      return 2;
    } else {
      return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        elevation: 10,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_sharp),
            label: "Chat",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.book_sharp),
            label: "Devotions",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
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
    );
  }
}
