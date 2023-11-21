import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class RAINetworkImage extends StatelessWidget {
  final String? imageUrl;
  final String? fallbackText;
  final double? fallbackTextSize;
  final double? width;
  final double? height;
  final FilterQuality filterQuality;

  const RAINetworkImage({
    super.key,
    required this.imageUrl,
    required this.fallbackText,
    this.fallbackTextSize = 20,
    this.width,
    this.height,
    this.filterQuality = FilterQuality.high,
  });

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl ?? "",
      width: width,
      height: height,
      filterQuality: filterQuality,
      progressIndicatorBuilder: (context, _, downloadProgress) {
        return Center(
          child: CircularProgressIndicator(
            value: downloadProgress.progress,
          ),
        );
      },
      errorWidget: (context, url, error) {
        return Center(
          child: Text(
            fallbackText ?? "",
            style: TextStyle(
              fontSize: fallbackTextSize,
            ),
          ),
        );
      },
    );
  }
}
