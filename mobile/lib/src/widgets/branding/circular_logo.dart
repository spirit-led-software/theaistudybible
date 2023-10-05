import 'package:flutter/material.dart';
import 'package:revelationsai/src/constants/colors.dart';

class CircularLogo extends StatelessWidget {
  final double radius;

  const CircularLogo({super.key, this.radius = 25});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: RAIColors.secondary,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(100),
        child: Image.asset("assets/icons/ios-icon.png"),
      ),
    );
  }
}
