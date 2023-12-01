import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/providers/user/generated_image/pages.dart';
import 'package:revelationsai/src/providers/user/preferences.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/generated_image/create_image_dialog.dart';
import 'package:revelationsai/src/widgets/network_image.dart';
import 'package:revelationsai/src/widgets/refresh_indicator.dart';

class AllImagesScreen extends HookConsumerWidget {
  const AllImagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider).requireValue;
    final currentUserPrefs = ref.watch(currentUserPreferencesProvider).requireValue;
    final imagesNotifier = ref.watch(userGeneratedImagesPagesProvider.notifier);
    final images = ref.watch(userGeneratedImagesPagesProvider);

    useEffect(() {
      imagesNotifier.refresh();
      return () {};
    }, []);

    return Scaffold(
      appBar: AppBar(
        title: const Text("AI-Generated Images"),
        actions: [
          IconButton(
            visualDensity: VisualDensity.compact,
            onPressed: () {
              context.go("/upgrade");
            },
            style: IconButton.styleFrom(
              shape: CircleBorder(
                side: BorderSide(
                  color: context.colorScheme.onPrimary.withOpacity(0.4),
                ),
              ),
              backgroundColor:
                  currentUser.remainingGeneratedImages < 1 ? context.colorScheme.error.withOpacity(0.2) : null,
            ),
            icon: Text(
              "${currentUser.remainingGeneratedImages > 10 ? ">10" : currentUser.remainingGeneratedImages}",
              style: context.textTheme.bodyMedium?.copyWith(
                color: context.colorScheme.onPrimary,
              ),
            ),
          ),
          IconButton(
            onPressed: () async {
              if (currentUserPrefs.hapticFeedback) {
                HapticFeedback.mediumImpact();
              }
              if (currentUser.remainingGeneratedImages < 1) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      "You have no remaining generated images. Please upgrade your account.",
                      style: context.textTheme.bodyMedium?.copyWith(
                        color: context.colorScheme.onError,
                      ),
                    ),
                    backgroundColor: context.colorScheme.error,
                  ),
                );
                context.go("/upgrade");
                return;
              }
              await showDialog(
                barrierDismissible: false,
                context: context,
                builder: (context) {
                  return const CreateImageDialog();
                },
              );
            },
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: images.when(
        data: (data) {
          final imagesFlat = data.expand((element) => element).toList();
          if (imagesFlat.isEmpty) {
            return const Center(
              child: Text("No images found"),
            );
          }

          return RAIRefreshIndicator(
            onRefresh: () async {
              await imagesNotifier.refresh();
            },
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: context.isTablet ? 4 : 3,
                    crossAxisSpacing: 5,
                    mainAxisSpacing: 5,
                  ),
                  itemCount: imagesFlat.length,
                  itemBuilder: (context, index) {
                    final image = imagesFlat[index];
                    return GestureDetector(
                      onTap: () {
                        context.go("/images/${image.id}");
                      },
                      child: RAINetworkImage(
                        imageUrl: image.url,
                        fallbackText: "Failed",
                      ),
                    );
                  },
                ),
                if (imagesNotifier.hasNextPage()) ...[
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      shape: const BeveledRectangleBorder(),
                    ),
                    onPressed: () async {
                      if (imagesNotifier.isLoadingNextPage()) {
                        return;
                      }
                      await imagesNotifier.fetchNextPage();
                    },
                    child: imagesNotifier.isLoadingNextPage()
                        ? SizedBox(
                            height: 20,
                            width: 20,
                            child: SpinKitSpinningLines(
                              color: context.secondaryColor,
                              size: 20,
                            ),
                          )
                        : const Text("Load more"),
                  ),
                ],
              ],
            ),
          );
        },
        error: (error, stackTrace) {
          return Center(
            child: Text(
              error.toString(),
              style: TextStyle(
                color: context.colorScheme.error,
              ),
            ),
          );
        },
        loading: () {
          return Center(
            child: SpinKitSpinningLines(color: context.secondaryColor),
          );
        },
      ),
    );
  }
}
