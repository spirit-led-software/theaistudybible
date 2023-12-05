import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/widgets/branding/circular_logo.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';
import 'package:url_launcher/link.dart';

class AboutScreen extends HookWidget {
  const AboutScreen({super.key});

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
        title: const Logo(
          colorScheme: RAIColorScheme.light,
        ),
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
            const CircularLogo(
              radius: 80,
            ),
            const SizedBox(
              height: 10,
            ),
            Text("Version ${version.data!.version}"),
            const SizedBox(
              height: 30,
            ),
            Wrap(
              alignment: WrapAlignment.center,
              children: [
                TextButton(
                  onPressed: () {
                    showLicensePage(
                      context: context,
                      applicationName: "RevelationsAI",
                      applicationIcon: const CircularLogo(
                        noShadow: true,
                      ),
                      applicationVersion: version.data!.version,
                      applicationLegalese: "© 2023 Ian Pascoe",
                    );
                  },
                  child: const Text(
                    "Licenses",
                  ),
                ),
                const SizedBox(
                  width: 10,
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
                  width: 10,
                ),
                TextButton(
                  onPressed: () {
                    context.push("/sources");
                  },
                  child: const Text(
                    "All Sources",
                  ),
                ),
              ],
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
