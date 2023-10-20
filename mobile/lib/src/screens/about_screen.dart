import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';
import 'package:url_launcher/link.dart';

class AboutScreen extends HookWidget {
  const AboutScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final version = useFuture(
      PackageInfo.fromPlatform(),
      initialData: PackageInfo(
        appName: "revelationsai",
        packageName: "com.passgoco.revelationsai",
        version: "unknown",
        buildNumber: "unknown",
      ),
    );

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: true,
        title: const Text("About RevelationsAI"),
        actions: [
          IconButton(
            onPressed: () {
              context.go("/account");
            },
            icon: const Icon(
              Icons.close,
            ),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Logo(
              colorScheme: context.brightness == Brightness.dark
                  ? RAIColorScheme.light
                  : RAIColorScheme.dark,
              fontSize: 32,
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
            Text("Version ${version.data!.version}"),
            const SizedBox(
              height: 80,
            ),
          ],
        ),
      ),
    );
  }
}
