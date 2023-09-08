import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';
import 'package:url_launcher/link.dart';

class AboutScreen extends HookWidget {
  const AboutScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: true,
        title: const Text("About RevelationsAI"),
        backgroundColor: RAIColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () {
              context.go("/account");
            },
            icon: const Icon(
              Icons.close,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Logo(
              fontSize: 32,
            ),
            const Text(
              "Copyright 2023",
              style: TextStyle(fontSize: 20),
            ),
            Link(
              uri: Uri.parse("https://www.iconfinder.com/"),
              builder: (context, followLink) {
                return TextButton(
                  onPressed: followLink,
                  child: const Text("Icons by IconFinder"),
                );
              },
            ),
            const SizedBox(
              height: 80,
            ),
          ],
        ),
      ),
    );
  }
}
