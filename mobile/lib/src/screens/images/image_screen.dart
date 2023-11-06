import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:revelationsai/src/providers/user/generated_image/single.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/network_image.dart';
import 'package:share_plus/share_plus.dart';

class ImageScreen extends HookConsumerWidget {
  final String id;

  const ImageScreen({Key? key, required this.id}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final imageNotifier = ref.watch(singleUserGeneratedImageProvider(id).notifier);
    final image = ref.watch(singleUserGeneratedImageProvider(id));

    useEffect(() {
      imageNotifier.refresh();
      return () {};
    }, []);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          image.hasValue
              ? DateFormat().add_yMd().addPattern(DateFormat.HOUR_MINUTE).format(image.value!.createdAt.toLocal())
              : "Image",
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await imageNotifier.refresh();
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            image.when(
              loading: () => SpinKitSpinningLines(
                color: context.secondaryColor,
              ),
              error: (err, stack) => Center(
                child: Text(
                  err.toString(),
                  style: TextStyle(
                    color: context.colorScheme.error,
                  ),
                ),
              ),
              data: (image) {
                return Column(
                  children: [
                    GestureDetector(
                      onLongPress: () {
                        Share.shareUri(
                          Uri.parse(image.url!),
                        );
                      },
                      child: RAINetworkImage(imageUrl: image!.url, fallbackText: image.id),
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: context.width * 0.05,
                        vertical: 15,
                      ),
                      child: Column(
                        children: [
                          Text(
                            image.userPrompt,
                            style: context.textTheme.headlineSmall,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 15),
                          Text(
                            "Image generation is a new feature and will not always be totally accurate. We are diligently working to improve the accuracy of the generated images by experimenting with different models.",
                            style: context.textTheme.bodySmall,
                            textAlign: TextAlign.center,
                          )
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
