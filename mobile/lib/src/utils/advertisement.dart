import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user/current.dart';

Future<bool> showAdvertisementLogic(
    WidgetRef ref, InterstitialAd? ad, int chanceNumerator, int chanceDenominator) async {
  try {
    final currentUser = await ref.read(currentUserProvider.future);
    if (currentUser.maxQueries <= 10) {
      final randomInt = (Random().nextDouble() * chanceDenominator).ceil();
      debugPrint("Random int for in ad logic: $randomInt");
      final showAd = randomInt % chanceNumerator;
      debugPrint("Will show an ad if this equals 0: $showAd");
      if (showAd == 0) {
        if (ad == null) {
          debugPrint("Ad is null, not showing ad");
          return false;
        }
        await ad.show();
        return true;
      }
    }
  } catch (e) {
    debugPrint("Error in advertisement logic: $e");
  }
  return false;
}
