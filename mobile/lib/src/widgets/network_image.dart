import 'package:flutter/material.dart';

class RAINetworkImage extends StatelessWidget {
  final String? imageUrl;
  final String? fallbackText;
  final double? fallbackTextSize;
  final double? width;
  final double? height;
  final double scale;
  final FilterQuality filterQuality;

  const RAINetworkImage({
    Key? key,
    required this.imageUrl,
    required this.fallbackText,
    this.fallbackTextSize = 20,
    this.width,
    this.height,
    this.scale = 1.0,
    this.filterQuality = FilterQuality.high,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Image.network(
      imageUrl ?? "",
      scale: scale,
      width: width,
      height: height,
      filterQuality: filterQuality,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Center(
          child: CircularProgressIndicator(
            value: loadingProgress.expectedTotalBytes != null
                ? loadingProgress.cumulativeBytesLoaded /
                    loadingProgress.expectedTotalBytes!
                : null,
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
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
