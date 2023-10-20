import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/branding/circular_logo.dart';

class LoginScreen extends HookConsumerWidget {
  final bool? resetPassword;

  const LoginScreen({Key? key, this.resetPassword = false}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formKey = useRef(GlobalKey<FormState>());

    final TextEditingController emailTextController =
        useTextEditingController();
    final emailFocusNode = useFocusNode();

    final TextEditingController passwordTextController =
        useTextEditingController();
    final passwordFocusNode = useFocusNode();

    final pendingLogin = useState<Future<void>?>(null);
    final snapshot = useFuture(pendingLogin.value);
    final alert = useState<Alert?>(null);

    final showPassword = useState(false);

    void handleSubmit() {
      if (formKey.value.currentState?.validate() ?? false) {
        final future = ref.read(currentUserProvider.notifier).login(
            emailTextController.value.text, passwordTextController.value.text);
        pendingLogin.value = future;
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
      pendingLogin.value = future;
    }

    useEffect(() {
      if (resetPassword == true) {
        alert.value = Alert(
          message:
              "Password reset successful. Please login with your new password.",
          type: AlertType.success,
        );
      }

      return () {};
    }, [resetPassword]);

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
      body: Center(
        child: SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          child: Card(
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
                          color: context.secondaryColor,
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
                                style: TextStyle(
                                  color: context.colorScheme.onError,
                                ),
                              ),
                            )
                          : const CircularLogo(radius: 30),
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
                                ),
                                SizedBox(
                                  width: 10,
                                ),
                                Text(
                                  "Login with Apple",
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
                  /* Removing facebook login for now due to problems with business verification 
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
                                color: context.primaryColor,
                              ),
                              SizedBox(
                                width: 10,
                              ),
                              Text(
                                "Login with Facebook",
                                style: TextStyle(
                                  color: context.primaryColor,
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
                  ), */
                  Flex(
                    direction: Axis.horizontal,
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
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
                              ),
                              SizedBox(
                                width: 10,
                              ),
                              Text(
                                "Login with Google",
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
                          color:
                              context.colorScheme.onBackground.withOpacity(0.5),
                        ),
                      ),
                      const SizedBox(
                        width: 10,
                      ),
                      const Text(
                        "OR",
                      ),
                      const SizedBox(
                        width: 10,
                      ),
                      Expanded(
                        child: Container(
                          height: 1,
                          color:
                              context.colorScheme.onBackground.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  Form(
                    key: formKey.value,
                    child: AutofillGroup(
                      child: Column(
                        children: [
                          TextFormField(
                            autofillHints: const [AutofillHints.email],
                            autocorrect: false,
                            keyboardType: TextInputType.emailAddress,
                            controller: emailTextController,
                            focusNode: emailFocusNode,
                            decoration: const InputDecoration(
                              hintText: "Email",
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
                            autofillHints: const [AutofillHints.password],
                            autocorrect: false,
                            obscureText: !showPassword.value,
                            keyboardType: TextInputType.visiblePassword,
                            controller: passwordTextController,
                            focusNode: passwordFocusNode,
                            onFieldSubmitted: (value) {
                              passwordFocusNode.unfocus();
                            },
                            onTapOutside: (event) {
                              passwordFocusNode.unfocus();
                            },
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return "Password is required";
                              }
                              return null;
                            },
                            decoration: InputDecoration(
                              hintText: "Password",
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
                          ),
                          const SizedBox(
                            height: 10,
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
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
                                    "Login with Email",
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  GestureDetector(
                    onTap: () {
                      context.go('/auth/register');
                    },
                    child: const Text(
                      "Don't have an account? Register",
                    ),
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  GestureDetector(
                    onTap: () {
                      context.go('/auth/forgot-password');
                    },
                    child: const Text(
                      "Forgot password?",
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
