import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:revelationsai/src/constants/admob.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'interstitial_ad.g.dart';

@Riverpod(keepAlive: true)
class InterstitialAds extends _$InterstitialAds {
  final _adUnitId = Platform.isIOS
      ? kDebugMode
          ? AdMob.testIosAdUnitId
          : AdMob.iosAdUnitId
      : kDebugMode
          ? AdMob.testAndroidAdUnitId
          : AdMob.androidAdUnitId;

  @override
  FutureOr<InterstitialAd?> build() async {
    await _loadAd();
    return state.valueOrNull;
  }

  Future<void> _loadAd() async {
    return await InterstitialAd.load(
      adUnitId: _adUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        // Called when an ad is successfully received.
        onAdLoaded: (ad) {
          ad.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) async {
              debugPrint('$ad dismissed full screen content.');
              await _loadAd();
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              debugPrint('$ad failed to show full screen content: $error');
            },
          );
          debugPrint('$ad loaded.');
          state = AsyncValue.data(ad);
        },
        onAdFailedToLoad: (LoadAdError error) async {
          debugPrint('InterstitialAd failed to load: $error');
          await _loadAd();
        },
      ),
    );
  }
}
