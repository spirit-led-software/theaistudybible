import 'dart:math';

import 'package:flutter/material.dart';
import 'package:in_app_review/in_app_review.dart';

/// Determines whether to show an in-app review dialog and requests a review if appropriate.
Future<bool> inAppReviewLogic() async {
  try {
    final randomInt = (Random().nextDouble() * 100).ceil();
    debugPrint("Random int for in app review logic: $randomInt");
    final showInAppReview = randomInt % 5;
    debugPrint("Will show an in-app-review if this equals 0: $showInAppReview");
    if (showInAppReview == 0) {
      final inAppReview = InAppReview.instance;
      return await inAppReview.isAvailable().then((value) async {
        if (value) {
          inAppReview.requestReview();
          return true;
        }
        return false;
      }).catchError((e, stack) {
        debugPrint("Error showing in-app-review: $e\n$stack");
        return false;
      });
    }
  } catch (e) {
    debugPrint("Error in in-app-review logic: $e");
  }
  return false;
}
