import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:image_gallery_saver/image_gallery_saver.dart';
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

    final isMounted = useIsMounted();
    final showImageActions = useState(false);
    final downloaded = useState(false);

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
                      onTap: () {
                        if (isMounted()) showImageActions.value = !showImageActions.value;
                      },
                      child: Stack(
                        children: [
                          RAINetworkImage(
                            imageUrl: image!.url,
                            fallbackText: image.id,
                          ),
                          if (showImageActions.value) ...[
                            Positioned.fill(
                              child: Container(
                                color: context.colorScheme.background.withOpacity(0.5),
                              ),
                            ),
                            Positioned.fromRelativeRect(
                              rect: RelativeRect.fill,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  IconButton(
                                    onPressed: () async {
                                      final res = await http.get(Uri.parse(image.url!));
                                      await ImageGallerySaver.saveImage(
                                        res.bodyBytes,
                                        name: image.id,
                                        quality: 100,
                                      );
                                      if (isMounted()) downloaded.value = true;
                                      Future.delayed(const Duration(seconds: 5), () {
                                        if (isMounted()) downloaded.value = false;
                                      });
                                    },
                                    iconSize: 40,
                                    icon: Icon(
                                      downloaded.value ? Icons.check : CupertinoIcons.square_arrow_down,
                                      color: downloaded.value ? Colors.green : context.colorScheme.onBackground,
                                    ),
                                  ),
                                  IconButton(
                                    onPressed: () async {
                                      await Share.shareUri(
                                        Uri.parse(image.url!),
                                      );
                                    },
                                    iconSize: 40,
                                    icon: FaIcon(
                                      CupertinoIcons.share_up,
                                      color: context.colorScheme.onBackground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ]
                        ],
                      ),
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
                            "Image generation is a new feature and will not always be totally accurate. We are diligently working to improve the accuracy of the generated images by experimenting with different models and prompts.",
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
