import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/user/preferences.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'preferences.g.dart';

@riverpod
class CurrentUserPreferences extends _$CurrentUserPreferences {
  late SharedPreferences _sharedPreferences;
  static const _sharedPrefsKey = 'preferences';

  @override
  FutureOr<UserPreferences> build() async {
    _sharedPreferences = await SharedPreferences.getInstance();

    _persistenceRefreshLogic();

    return _preferenceRecoveryAttempt();
  }

  FutureOr<UserPreferences> _preferenceRecoveryAttempt() async {
    try {
      final savedPrefs = _sharedPreferences.getString(_sharedPrefsKey);
      if (savedPrefs == null) {
        return UserPreferences.defaults();
      }
      return UserPreferences.fromJson(jsonDecode(savedPrefs));
    } catch (error, stackTrace) {
      debugPrint("Failed to recover preferences: $error $stackTrace");
      await _sharedPreferences.remove(_sharedPrefsKey);
      return UserPreferences.defaults();
    }
  }

  void _persistenceRefreshLogic() {
    ref.listenSelf((_, next) {
      if (next.isLoading) return;
      if (next.hasError) {
        _sharedPreferences.remove(_sharedPrefsKey);
        return;
      }

      if (next.hasValue) {
        final prefsString = jsonEncode(next.value!.toJson());
        debugPrint("Saving preferences to disk $prefsString");
        _sharedPreferences.setString(_sharedPrefsKey, prefsString);
        _sharedPreferences.remove(_sharedPrefsKey);
      }
    });
  }

  FutureOr<UserPreferences> setHapticFeedback(bool value) async {
    final newPrefs = state.requireValue.copyWith(
      hapticFeedback: value,
    );
    state = AsyncData(newPrefs);
    return newPrefs;
  }
}
