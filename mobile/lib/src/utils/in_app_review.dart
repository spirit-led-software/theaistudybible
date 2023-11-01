import 'dart:math';

import 'package:flutter/material.dart';
import 'package:in_app_review/in_app_review.dart';

/// Determines whether to show an in-app review dialog and requests a review if appropriate.
///
/// This method generates a random integer between 1 and 144, and if the integer is divisible by 12,
/// it will attempt to show an in-app review dialog. If the in-app review API is available, it will
/// request a review from the user.
Future<bool> inAppReviewLogic() async {
  try {
    final randomInt = (Random().nextDouble() * 144).ceil();
    debugPrint("Random int for in app review logic: $randomInt");
    final showInAppReview = randomInt % 12;
    debugPrint("Will show an in-app-review if this equals 0: $showInAppReview");
    if (showInAppReview == 0) {
      final inAppReview = InAppReview.instance;
      return await inAppReview.isAvailable().then((value) async {
        if (value) {
          inAppReview.requestReview();
          return true;
        }
        return false;
      }).catchError((e) {
        debugPrint("Error showing in-app-review: ${e.toString()}");
        return false;
      });
    }
  } catch (e) {
    debugPrint("Error in in-app-review logic: $e");
  }
  return false;
}
