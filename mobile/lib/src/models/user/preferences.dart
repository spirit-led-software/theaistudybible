import 'package:freezed_annotation/freezed_annotation.dart';

part 'preferences.freezed.dart';
part 'preferences.g.dart';

@freezed
class UserPreferences with _$UserPreferences {
  factory UserPreferences({
    required bool hapticFeedback,
  }) = _UserPreferences;

  factory UserPreferences.defaults() => UserPreferences(
        hapticFeedback: true,
      );

  factory UserPreferences.fromJson(Map<String, dynamic> json) =>
      _$UserPreferencesFromJson(json);
}
