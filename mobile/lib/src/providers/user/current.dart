import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/constants/store.dart';
import 'package:revelationsai/src/models/user.dart';
import 'package:revelationsai/src/models/user/request.dart';
import 'package:revelationsai/src/providers/chat/current_id.dart';
import 'package:revelationsai/src/providers/chat/pages.dart';
import 'package:revelationsai/src/providers/devotion/current_id.dart';
import 'package:revelationsai/src/services/user.dart';
import 'package:revelationsai/src/utils/http_helpers.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'current.g.dart';

@Riverpod(keepAlive: true)
class CurrentUser extends _$CurrentUser {
  late SharedPreferences _sharedPreferences;
  static const _sharedPrefsKey = 'token';

  @override
  FutureOr<UserInfo> build() async {
    _sharedPreferences = await SharedPreferences.getInstance();

    _persistenceRefreshLogic();
    _purchasesConfigurationLogic();

    return _loginRecoveryAttempt();
  }

  FutureOr<UserInfo> _loginRecoveryAttempt() async {
    try {
      final savedSession = _sharedPreferences.getString(_sharedPrefsKey);
      if (savedSession == null) {
        throw Exception('No auth token found');
      }

      return await _loginWithToken(savedSession);
    } catch (e) {
      if (e is RAIHttpException && e.isUnauthorized) {
        await _sharedPreferences.remove(_sharedPrefsKey);
      }
      rethrow;
    }
  }

  Future<void> login(String email, String password) async {
    debugPrint("Logging in using $email at ${API.url}/auth/credentials-mobile/login");

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
      state = AsyncData<UserInfo>(await _loginWithToken(session));
    } catch (e) {
      debugPrint("Failed to login with token: $e");
      throw Exception('Failed to login with token');
    }
  }

  Future<void> loginWithApple(String authorizationCode) async {
    debugPrint("Logging in using Apple at ${API.url}/auth/credentials-mobile/login/apple");

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

  Future<User> updateUser(UpdateUserRequest request) async {
    final currentUser = state.value;
    if (currentUser == null) {
      throw Exception('No user logged in');
    }

    final prevState = state;

    try {
      state = AsyncData(currentUser.copyWith(
        name: request.name ?? currentUser.name,
        email: request.email ?? currentUser.email,
        image: request.image ?? currentUser.image,
        translation: request.translation ?? currentUser.translation,
      ));

      final user = await UserService.updateUser(
        session: currentUser.session,
        id: currentUser.id,
        request: request,
      ).then((user) {
        state = AsyncData(state.requireValue.copyWith(
          name: user.name,
          email: user.email,
          image: user.image,
          translation: user.translation,
        ));
        return user;
      });
      return user;
    } catch (e) {
      state = prevState;
      rethrow;
    } finally {
      refresh();
    }
  }

  Future<void> logout() async {
    state = AsyncValue.error(Exception("Not logged in"), StackTrace.current);
  }

  FutureOr<UserInfo> _loginWithToken(String session) async {
    try {
      return await UserService.getUserInfo(session);
    } catch (e) {
      debugPrint("Failed to login with token: $e");
      throw Exception('Failed to login with token');
    }
  }

  Future<void> register(String email, String password) async {
    debugPrint("Registering using $email at ${API.url}/auth/credentials-mobile/register");

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
      Uri.parse('${API.url}/auth/credentials-mobile/forgot-password?email=$email'),
    );

    if (res.statusCode != 200) {
      debugPrint("Failed to send forgot password email: ${res.statusCode} ${res.body}");
      throw Exception('Failed to send forgot password email');
    }
  }

  Future<void> resetPassword(String token, String password) async {
    debugPrint("Resetting password using token $token at ${API.url}/auth/credentials-mobile/reset-password");

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
      if (next.hasError || !next.hasValue) {
        if (next.error is RAIHttpException && (next.error as RAIHttpException).isUnauthorized) {
          _sharedPreferences.remove(_sharedPrefsKey);
          ref.read(currentChatIdProvider.notifier).update(null);
          ref.read(currentDevotionIdProvider.notifier).updateId(null);
          ref.read(chatsPagesProvider.notifier).reset();
        }
        return;
      }

      if (next.hasValue) {
        _sharedPreferences.setString(_sharedPrefsKey, next.value!.session);
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

  Future<void> decrementRemainingImages() async {
    state = AsyncData(state.requireValue.copyWith(
      remainingGeneratedImages: state.requireValue.remainingGeneratedImages - 1,
    ));
    ref.invalidateSelf();
  }

  void refresh() {
    ref.invalidateSelf();
  }

  Future<User> updateUserImage(CroppedFile value) async {
    final imageUrl = await UserService.uploadProfilePicture(
      file: value,
      session: state.requireValue.session,
    );

    return await updateUser(UpdateUserRequest(image: imageUrl));
  }

  Future<void> updateUserPassword(UpdatePasswordRequest request) async {
    return await UserService.updatePassword(
      session: state.requireValue.session,
      request: request,
    );
  }
}
