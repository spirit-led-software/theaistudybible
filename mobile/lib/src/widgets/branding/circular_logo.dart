import 'package:flutter/material.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class CircularLogo extends StatelessWidget {
  final double radius;
  final bool noShadow;

  const CircularLogo({super.key, this.radius = 25, this.noShadow = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.primaryColor,
        borderRadius: BorderRadius.circular(500),
        boxShadow: [
          if (!noShadow) ...[
            BoxShadow(
              color: context.theme.shadowColor.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ],
      ),
      child: CircleAvatar(
        radius: radius,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(500),
          child: Image.asset(
            "assets/icons/ios-icon.png",
            height: radius * 1.95,
            width: radius * 1.95,
            fit: BoxFit.fill,
          ),
        ),
      ),
    );
  }
}
