import 'dart:math';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/advertisements/interstitial_ad.dart';
import 'package:revelationsai/src/providers/user/current.dart';

Future<bool> showAdvertisementLogic(WidgetRef ref, {int? chanceNumerator}) async {
  try {
    final ad = await ref.read(interstitialAdsProvider.future);
    if (ad == null) {
      debugPrint("Ad is null, not showing ad");
      return false;
    }

    final currentUser = await ref.read(currentUserProvider.future);
    if (chanceNumerator == null) {
      switch (currentUser.maxQueries) {
        case <= 5:
          chanceNumerator = 1;
          break;
        case <= 10:
          chanceNumerator = 2;
          break;
        case <= 25:
          chanceNumerator = 3;
          break;
        default:
          return false;
      }
    }
    if (currentUser.maxQueries > 25) {
      debugPrint("Subscription high enough to not show ads");
      return false;
    }

    final randomInt = (Random().nextDouble() * 100).ceil();
    debugPrint("Random int for in ad logic: $randomInt");
    final showAd = randomInt % chanceNumerator;
    debugPrint("Will show an ad if this equals 0: $showAd");
    if (showAd == 0) {
      await ad.show();
      return true;
    }
    return false;
  } catch (e) {
    debugPrint("Error in advertisement logic: $e");
    return false;
  }
}
