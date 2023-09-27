import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/constants/store.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/services/user.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'current.g.dart';

@riverpod
class CurrentUser extends _$CurrentUser {
  late SharedPreferences _sharedPreferences;
  static const _sharedPrefsKey = 'token';

  @override
  FutureOr<User> build() async {
    _sharedPreferences = await SharedPreferences.getInstance();

    _persistenceRefreshLogic();
    _purchasesConfigurationLogic();

    return _loginRecoveryAttempt();
  }

  FutureOr<User> _loginRecoveryAttempt() async {
    try {
      final savedSession = _sharedPreferences.getString(_sharedPrefsKey);
      if (savedSession == null) {
        throw const UnauthorizedException('No auth token found');
      }

      return await _loginWithToken(savedSession);
    } catch (_, __) {
      await _sharedPreferences.remove(_sharedPrefsKey);
      throw const UnauthorizedException('No auth token found');
    }
  }

  Future<void> login(String email, String password) async {
    debugPrint(
        "Logging in using $email at ${API.url}/auth/credentials-mobile/login");

    Response res = await post(
      Uri.parse('${API.url}/auth/credentials-mobile/login'),
      headers: <String, String>{
        'Content-Type': 'application/json',
      },
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
      }),
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to login: ${res.statusCode} ${res.body}");
      throw Exception('Failed to login');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));
    String session = data['session'];

    state = AsyncData(await _loginWithToken(session));
  }

  Future<void> loginWithToken(String session) async {
    try {
      state = AsyncData<User>(await _loginWithToken(session));
    } catch (e) {
      debugPrint("Failed to login with token: $e");
      throw Exception('Failed to login with token');
    }
  }

  Future<void> loginWithApple(String authorizationCode) async {
    debugPrint(
        "Logging in using Apple at ${API.url}/auth/credentials-mobile/login/apple");

    Response res = await post(
      Uri.parse('${API.url}/auth/apple-mobile/callback'),
      headers: <String, String>{
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        'code': authorizationCode,
      },
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to login with Apple: ${res.statusCode} ${res.body}");
      throw Exception('Failed to login with Apple');
    }

    var data = jsonDecode(utf8.decode(res.bodyBytes));
    String session = data['session'];

    await loginWithToken(session);
  }

  Future<void> logout() async {
    state = AsyncValue.error(
        const UnauthorizedException("Not logged in"), StackTrace.current);
  }

  FutureOr<User> _loginWithToken(String session) async {
    try {
      return await UserService.getUserInfo(session);
    } catch (e) {
      debugPrint("Failed to login with token: $e");
      throw Exception('Failed to login with token');
    }
  }

  Future<void> register(String email, String password) async {
    debugPrint(
        "Registering using $email at ${API.url}/auth/credentials-mobile/register");

    Response res = await post(
      Uri.parse('${API.url}/auth/credentials-mobile/register'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
      }),
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to register: ${res.statusCode} ${res.body}");
      throw Exception(['Failed to register user', res.body]);
    }
  }

  Future<void> forgotPassword(String email) async {
    Response res = await get(
      Uri.parse(
          '${API.url}/auth/credentials-mobile/forgot-password?email=$email'),
    );

    if (res.statusCode != 200) {
      debugPrint(
          "Failed to send forgot password email: ${res.statusCode} ${res.body}");
      throw Exception('Failed to send forgot password email');
    }
  }

  Future<void> resetPassword(String token, String password) async {
    debugPrint(
        "Resetting password using token $token at ${API.url}/auth/credentials-mobile/reset-password");

    Response res = await post(
      Uri.parse('${API.url}/auth/credentials-mobile/reset-password'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(<String, String>{
        'password': password,
        'token': token,
      }),
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to reset password: ${res.statusCode} ${res.body}");
      throw Exception('Failed to reset password');
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
        _sharedPreferences.setString(_sharedPrefsKey, next.value!.session);
      } else {
        _sharedPreferences.remove(_sharedPrefsKey);
      }
    });
  }

  void _purchasesConfigurationLogic() {
    ref.listenSelf((_, next) {
      if (next.isLoading) return;
      if (next.hasError || !next.hasValue) {
        return;
      }

      Purchases.isConfigured.then((isConfigured) {
        if (!isConfigured) {
          debugPrint('Initializing Purchases...');
          PurchasesConfiguration configuration;
          if (Platform.isAndroid) {
            configuration = PurchasesConfiguration(RAIStore.playStoreApiKey);
          } else if (Platform.isIOS) {
            configuration = PurchasesConfiguration(RAIStore.appStoreApiKey);
          } else {
            throw UnsupportedError("Unsupported platform");
          }
          configuration.appUserID = next.value!.id;
          Purchases.configure(configuration);
        } else {
          Purchases.logIn(next.value!.id);
        }
      });
    });
  }

  Future<void> decrementRemainingQueries() async {
    state = AsyncData(state.requireValue.copyWith(
      remainingQueries: state.requireValue.remainingQueries - 1,
    ));
    ref.invalidateSelf();
  }
}

class UnauthorizedException implements Exception {
  const UnauthorizedException(this.message);
  final String message;
}
