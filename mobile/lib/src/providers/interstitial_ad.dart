import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:revelationsai/src/constants/admob.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'interstitial_ad.g.dart';

@riverpod
class InterstitialAds extends _$InterstitialAds {
  @override
  FutureOr<InterstitialAd?> build() async {
    final adUnitId = Platform.isIOS
        ? kDebugMode
            ? AdMob.testIosAdUnitId
            : AdMob.iosAdUnitId
        : kDebugMode
            ? AdMob.testAndroidAdUnitId
            : AdMob.androidAdUnitId;

    await InterstitialAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        // Called when an ad is successfully received.
        onAdLoaded: (ad) {
          ad.fullScreenContentCallback = FullScreenContentCallback(
            // Called when the ad showed the full screen content.
            onAdShowedFullScreenContent: (ad) {
              debugPrint('ad onAdShowedFullScreenContent.');
            },
            // Called when an impression occurs on the ad.
            onAdImpression: (ad) {
              debugPrint('$ad impression occurred.');
            },
            // Called when the ad failed to show full screen content.
            onAdFailedToShowFullScreenContent: (ad, err) {
              debugPrint('InterstitialAd failed to show full screen content: $err');
              // Dispose the ad here to free resources.
              ad.dispose();
              ref.invalidateSelf();
            },
            // Called when the ad dismissed full screen content.
            onAdDismissedFullScreenContent: (ad) {
              debugPrint('$ad dismissed full screen content.');
              // Dispose the ad here to free resources.
              ad.dispose();
              ref.invalidateSelf();
            },
            // Called when a click is recorded for an ad.
            onAdClicked: (ad) {
              debugPrint('$ad clicked.');
            },
          );
          debugPrint('$ad loaded.');
          state = AsyncValue.data(ad);
        },
        // Called when an ad request failed.
        onAdFailedToLoad: (LoadAdError error) {
          debugPrint('InterstitialAd failed to load: $error');
        },
      ),
    );
    return state.valueOrNull;
  }
}
