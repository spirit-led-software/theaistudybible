import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/services/user.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'user.g.dart';

@riverpod
class CurrentUser extends _$CurrentUser {
  late SharedPreferences _sharedPreferences;
  static const _sharedPrefsKey = 'token';

  @override
  FutureOr<User> build() async {
    _sharedPreferences = await SharedPreferences.getInstance();

    _persistenceRefreshLogic();

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
    try {
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
    } catch (e) {
      debugPrint("Failed to login: $e");
      throw Exception('Failed to login');
    }
  }

  Future<void> loginWithToken(String session) async {
    try {
      state = AsyncData<User>(await _loginWithToken(session));
    } catch (e) {
      debugPrint("Failed to login with token: $e");
      throw Exception('Failed to login with token');
    }
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
    try {
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
    } catch (e) {
      debugPrint("Failed to register: $e");
      throw Exception(['Failed to register user', e]);
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
}

class UnauthorizedException implements Exception {
  const UnauthorizedException(this.message);
  final String message;
}
