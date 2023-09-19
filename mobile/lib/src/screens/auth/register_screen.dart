import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class RegisterScreen extends HookConsumerWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formKey = useRef(GlobalKey<FormState>());

    final TextEditingController emailTextController =
        useTextEditingController();
    final emailFocusNode = useFocusNode();

    final TextEditingController passwordTextController =
        useTextEditingController();
    final passwordFocusNode = useFocusNode();

    final TextEditingController confirmPasswordTextController =
        useTextEditingController();
    final confirmPasswordFocusNode = useFocusNode();

    final pendingRegister = useState<Future<void>?>(null);
    final snapshot = useFuture(pendingRegister.value);
    final alert = useState<Alert?>(null);

    final showPassword = useState(false);
    final showConfirmPassword = useState(false);

    void handleSubmit() {
      if (formKey.value.currentState?.validate() ?? false) {
        final future = ref
            .read(currentUserProvider.notifier)
            .register(emailTextController.value.text,
                passwordTextController.value.text)
            .then((value) {
          alert.value = Alert(
            message: "Check your email for a verification link.",
            type: AlertType.success,
          );
        });
        pendingRegister.value = future;
      }
    }

    void handleSocialLogin(String provider) async {
      final url = "${API.url}/auth/$provider-mobile/authorize";
      final authResult = await FlutterWebAuth2.authenticate(
        url: url,
        callbackUrlScheme: "revelationsai",
      );
      final token = Uri.parse(authResult).queryParameters['token'];
      if (token == null) {
        alert.value = Alert(
          message: "Login failed. Please try again.",
          type: AlertType.error,
        );
        return;
      }
      final future =
          ref.read(currentUserProvider.notifier).loginWithToken(token);
      pendingRegister.value = future;
    }

    useEffect(
      () {
        if (snapshot.hasError &&
            snapshot.connectionState != ConnectionState.waiting) {
          alert.value = Alert(
            message: snapshot.error.toString(),
            type: AlertType.error,
          );
        }

        return () {};
      },
      [
        snapshot.connectionState,
        snapshot.hasError,
        snapshot.error,
      ],
    );

    useEffect(
      () {
        if (alert.value != null) {
          Future.delayed(
            const Duration(seconds: 8),
          ).then(
            (value) => alert.value = null,
          );
        }

        return () {};
      },
      [alert.value],
    );

    return Scaffold(
      backgroundColor: RAIColors.primary,
      body: Center(
        child: SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          child: Card(
            color: Colors.white,
            elevation: 3,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(
                Radius.circular(0),
              ),
            ),
            child: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  (snapshot.connectionState == ConnectionState.waiting)
                      ? SpinKitSpinningLines(
                          color: RAIColors.secondary,
                          size: 32,
                        )
                      : alert.value != null
                          ? Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(15),
                                color: alert.value!.type == AlertType.error
                                    ? Colors.red
                                    : Colors.green,
                              ),
                              child: Text(
                                alert.value!.message,
                                style: const TextStyle(
                                  color: Colors.white,
                                ),
                              ),
                            )
                          : Container(
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: RAIColors.primary,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(15),
                              ),
                              padding: const EdgeInsets.all(10),
                              child: const FittedBox(
                                child: Logo(
                                  fontSize: 28,
                                ),
                              ),
                            ),
                  const SizedBox(
                    height: 30,
                  ),
                  if (Platform.isIOS) ...[
                    Flex(
                      direction: Axis.horizontal,
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: RAIColors.primary,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(5),
                              ),
                              padding: const EdgeInsets.only(
                                top: 15,
                                bottom: 15,
                              ),
                            ),
                            onPressed: () async {
                              handleSocialLogin("apple");
                            },
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                FaIcon(
                                  FontAwesomeIcons.apple,
                                  color: Colors.white,
                                ),
                                SizedBox(
                                  width: 10,
                                ),
                                Text(
                                  "Register with Apple",
                                  style: TextStyle(
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(
                      height: 10,
                    ),
                  ],
                  Flex(
                    direction: Axis.horizontal,
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: RAIColors.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(5),
                            ),
                            padding: const EdgeInsets.only(
                              top: 15,
                              bottom: 15,
                            ),
                          ),
                          onPressed: () async {
                            handleSocialLogin("facebook");
                          },
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              FaIcon(
                                FontAwesomeIcons.facebookF,
                                color: Colors.white,
                              ),
                              SizedBox(
                                width: 10,
                              ),
                              Text(
                                "Register with Facebook",
                                style: TextStyle(
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  Flex(
                    direction: Axis.horizontal,
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: RAIColors.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(5),
                            ),
                            padding: const EdgeInsets.only(
                              top: 15,
                              bottom: 15,
                            ),
                          ),
                          onPressed: () async {
                            handleSocialLogin("google");
                          },
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              FaIcon(
                                FontAwesomeIcons.google,
                                color: Colors.white,
                              ),
                              SizedBox(
                                width: 10,
                              ),
                              Text(
                                "Register with Google",
                                style: TextStyle(
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  Flex(
                    mainAxisAlignment: MainAxisAlignment.center,
                    direction: Axis.horizontal,
                    children: [
                      Expanded(
                        child: Container(
                          height: 1,
                          color: Colors.grey.shade300,
                        ),
                      ),
                      const SizedBox(
                        width: 10,
                      ),
                      Text(
                        "OR",
                        style: TextStyle(
                          color: RAIColors.primary,
                        ),
                      ),
                      const SizedBox(
                        width: 10,
                      ),
                      Expanded(
                        child: Container(
                          height: 1,
                          color: Colors.grey.shade300,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  Form(
                    key: formKey.value,
                    child: Column(
                      children: [
                        TextFormField(
                          autocorrect: false,
                          keyboardType: TextInputType.emailAddress,
                          controller: emailTextController,
                          focusNode: emailFocusNode,
                          style: TextStyle(
                            color: RAIColors.primary,
                          ),
                          decoration: InputDecoration(
                            hintText: "Email",
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(5),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color: RAIColors.primary,
                                width: 1,
                              ),
                            ),
                          ),
                          onTapOutside: (event) {
                            emailFocusNode.unfocus();
                          },
                          onFieldSubmitted: (value) {
                            emailFocusNode.unfocus();
                            passwordFocusNode.requestFocus();
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Email is required";
                            }
                            return null;
                          },
                        ),
                        const SizedBox(
                          height: 10,
                        ),
                        TextFormField(
                          autocorrect: false,
                          obscureText: !showPassword.value,
                          keyboardType: TextInputType.visiblePassword,
                          controller: passwordTextController,
                          focusNode: passwordFocusNode,
                          style: TextStyle(
                            color: RAIColors.primary,
                          ),
                          decoration: InputDecoration(
                            hintText: "Password",
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(5),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color: RAIColors.primary,
                                width: 1,
                              ),
                            ),
                            suffixIcon: IconButton(
                              onPressed: () {
                                showPassword.value = !showPassword.value;
                              },
                              icon: FaIcon(
                                showPassword.value
                                    ? FontAwesomeIcons.eye
                                    : FontAwesomeIcons.eyeSlash,
                                size: 18,
                              ),
                            ),
                          ),
                          onTapOutside: (event) {
                            passwordFocusNode.unfocus();
                          },
                          onFieldSubmitted: (value) {
                            passwordFocusNode.unfocus();
                            confirmPasswordFocusNode.requestFocus();
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Password is required";
                            }
                            return null;
                          },
                        ),
                        const SizedBox(
                          height: 10,
                        ),
                        TextFormField(
                          autocorrect: false,
                          obscureText: !showConfirmPassword.value,
                          keyboardType: TextInputType.visiblePassword,
                          controller: confirmPasswordTextController,
                          focusNode: confirmPasswordFocusNode,
                          style: TextStyle(
                            color: RAIColors.primary,
                          ),
                          decoration: InputDecoration(
                            hintText: "Confirm Password",
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(5),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color: RAIColors.primary,
                                width: 1,
                              ),
                            ),
                            suffixIcon: IconButton(
                              onPressed: () {
                                showConfirmPassword.value =
                                    !showConfirmPassword.value;
                              },
                              icon: FaIcon(
                                showConfirmPassword.value
                                    ? FontAwesomeIcons.eye
                                    : FontAwesomeIcons.eyeSlash,
                                size: 18,
                              ),
                            ),
                          ),
                          onTapOutside: (event) {
                            confirmPasswordFocusNode.unfocus();
                          },
                          onFieldSubmitted: (value) {
                            confirmPasswordFocusNode.unfocus();
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Confirm Password is required";
                            }
                            if (value != passwordTextController.value.text) {
                              return "Passwords do not match";
                            }
                            return null;
                          },
                        ),
                        const SizedBox(
                          height: 10,
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: RAIColors.primary,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                  padding: const EdgeInsets.only(
                                    top: 15,
                                    bottom: 15,
                                  ),
                                ),
                                onPressed: () async {
                                  handleSubmit();
                                },
                                child: const Text(
                                  "Register with Email",
                                  style: TextStyle(
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  GestureDetector(
                    onTap: () {
                      context.go('/auth/login');
                    },
                    child: Text(
                      "Already have an account? Login",
                      style: TextStyle(
                        color: RAIColors.primary,
                      ),
                    ),
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
