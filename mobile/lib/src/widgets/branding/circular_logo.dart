import 'package:flutter/material.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class CircularLogo extends StatelessWidget {
  final double radius;

  const CircularLogo({super.key, this.radius = 25});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      child: Container(
        decoration: BoxDecoration(
          color: context.primaryColor,
          borderRadius: BorderRadius.circular(100),
          boxShadow: [
            BoxShadow(
              color: context.theme.shadowColor.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(100),
          child: Image.asset("assets/icons/ios-icon.png"),
        ),
      ),
    );
  }
}
