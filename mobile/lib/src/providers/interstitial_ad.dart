import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:revelationsai/src/constants/admob.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'interstitial_ad.g.dart';

@riverpod
Future<InterstitialAd> interstitialAd(InterstitialAdRef ref) async {
  final adUnitId = Platform.isIOS
      ? kDebugMode
          ? AdMob.testIosAdUnitId
          : AdMob.iosAdUnitId
      : kDebugMode
          ? AdMob.testAndroidAdUnitId
          : AdMob.androidAdUnitId;

  InterstitialAd? loadedAd;
  await InterstitialAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        // Called when an ad is successfully received.
        onAdLoaded: (ad) {
          debugPrint('$ad loaded.');
          // Keep a reference to the ad so you can show it later.
          loadedAd = ad;
        },
        // Called when an ad request failed.
        onAdFailedToLoad: (LoadAdError error) {
          debugPrint('InterstitialAd failed to load: $error');
        },
      ));

  if (loadedAd == null) {
    throw Exception("InterstitialAd failed to load");
  }
  return loadedAd!;
}
