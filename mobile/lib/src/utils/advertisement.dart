import 'dart:math';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/interstitial_ad.dart';
import 'package:revelationsai/src/providers/user/current.dart';

Future<bool> advertisementLogic(WidgetRef ref) async {
  try {
    final currentUser = await ref.read(currentUserProvider.future);
    if (currentUser.maxQueries <= 10) {
      final ad = await ref.read(interstitialAdProvider.future);
      final randomInt = (Random().nextDouble() * 100).ceil();
      debugPrint("Random int for in ad logic: $randomInt");
      final showAd = randomInt % 10;
      debugPrint("Will show an ad if this equals 0: $showAd");
      if (showAd == 0) {
        ad.show();
        return true;
      }
    }
  } catch (e) {
    debugPrint("Error in advertisement logic: $e");
  }
  return false;
}
