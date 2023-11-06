import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user/generated_image/pages.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/generated_image/create_image_dialog.dart';
import 'package:revelationsai/src/widgets/network_image.dart';

class AllImagesScreen extends HookConsumerWidget {
  const AllImagesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final imagesNotifier = ref.watch(userGeneratedImagesPagesProvider.notifier);
    final images = ref.watch(userGeneratedImagesPagesProvider);

    useEffect(() {
      imagesNotifier.refresh();
      return () {};
    }, []);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Generated Images"),
        actions: [
          IconButton(
            onPressed: () async {
              await showDialog(
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

          return RefreshIndicator(
            onRefresh: () async {
              await imagesNotifier.refresh();
            },
            child: GridView.builder(
              shrinkWrap: true,
              physics: const AlwaysScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 5,
                mainAxisSpacing: 5,
              ),
              itemCount: imagesFlat.length + 1,
              itemBuilder: (context, index) {
                if (index == imagesFlat.length) {
                  if (imagesNotifier.isLoadingNextPage()) {
                    return Center(
                      child: SpinKitSpinningLines(
                        color: context.secondaryColor,
                        size: 30,
                      ),
                    );
                  }

                  if (imagesNotifier.hasNextPage()) {
                    return Center(
                      child: ElevatedButton(
                        onPressed: () async {
                          await imagesNotifier.fetchNextPage();
                        },
                        child: const Text("Load more"),
                      ),
                    );
                  } else {
                    return const SizedBox();
                  }
                }

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
          );
        },
        error: (error, stackTrace) {
          return Center(
            child: Text(error.toString()),
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
