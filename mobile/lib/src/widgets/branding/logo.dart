import 'package:flutter/material.dart';
import 'package:revelationsai/src/constants/colors.dart';

class Logo extends StatelessWidget {
  final double fontSize;

  final RAIColorScheme colorScheme;

  const Logo({
    super.key,
    this.fontSize = 24,
    this.colorScheme = RAIColorScheme.dark,
  });

  @override
  Widget build(BuildContext context) {
    Color fontColor =
        colorScheme == RAIColorScheme.dark ? RAIColors.primary : Colors.white;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "revelations",
          style: TextStyle(
            color: fontColor,
            fontSize: fontSize,
          ),
        ),
        Text(
          "AI",
          style: TextStyle(
            color: RAIColors.secondary,
            fontSize: fontSize,
          ),
        ),
      ],
    );
  }
}
