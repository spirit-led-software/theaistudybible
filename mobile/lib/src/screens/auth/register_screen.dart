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
import 'package:revelationsai/src/widgets/branding/logo.dart';

class RegisterScreen extends HookConsumerWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formKey = useRef(GlobalKey<FormState>());

    final TextEditingController emailTextController = useTextEditingController();
    final emailFocusNode = useFocusNode();

    final TextEditingController passwordTextController = useTextEditingController();
    final passwordFocusNode = useFocusNode();

    final TextEditingController confirmPasswordTextController = useTextEditingController();
    final confirmPasswordFocusNode = useFocusNode();

    final pendingRegister = useState<Future<void>?>(null);
    final snapshot = useFuture(pendingRegister.value);
    final alert = useState<Alert?>(null);

    final showPassword = useState(false);
    final showConfirmPassword = useState(false);

    final isLoading = !snapshot.hasData && !snapshot.hasError && snapshot.connectionState == ConnectionState.waiting;

    final handleSubmit = useCallback(
      () async {
        if (formKey.value.currentState?.validate() ?? false) {
          pendingRegister.value = ref
              .read(currentUserProvider.notifier)
              .register(emailTextController.value.text, passwordTextController.value.text)
              .then((value) {
            alert.value = Alert(
              message: "Check your email for a verification link.",
              type: AlertType.success,
            );
          }).catchError((error) {
            alert.value = Alert(
              message: error.toString(),
              type: AlertType.error,
            );
          });
          await pendingRegister.value;
        }
      },
      [
        ref,
        formKey.value,
        emailTextController.value.text,
        passwordTextController.value.text,
      ],
    );

    final handleSocialLogin = useCallback((String provider) async {
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
      pendingRegister.value = ref.read(currentUserProvider.notifier).loginWithToken(token).catchError((error) {
        alert.value = Alert(
          message: error.toString(),
          type: AlertType.error,
        );
      });
      await pendingRegister.value;
    }, [ref]);

    useEffect(
      () {
        if (snapshot.hasError) {
          alert.value = Alert(
            message: snapshot.error.toString(),
            type: AlertType.error,
          );
        }
        return () {};
      },
      [
        snapshot,
        snapshot.hasError,
        snapshot.error,
      ],
    );

    useEffect(
      () {
        if (alert.value != null) {
          Future.delayed(
            const Duration(seconds: 8),
            () => alert.value = null,
          );
        }
        return () {};
      },
      [alert.value],
    );

    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Expanded(
            child: Center(
              child: Logo(
                width: 300,
              ),
            ),
          ),
          Card(
            elevation: 3,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(25),
                topRight: Radius.circular(25),
              ),
            ),
            child: SingleChildScrollView(
              child: SafeArea(
                child: Container(
                  padding: const EdgeInsets.only(
                    left: 20,
                    right: 20,
                    bottom: 30,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      alert.value != null
                          ? Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(15),
                                color: alert.value!.type == AlertType.error ? Colors.red : Colors.green,
                              ),
                              child: Text(
                                alert.value!.message,
                                style: TextStyle(
                                  color: context.colorScheme.onError,
                                ),
                              ),
                            )
                          : (isLoading)
                              ? Container(
                                  height: 32,
                                  width: 32,
                                  padding: const EdgeInsets.all(10),
                                  child: SpinKitSpinningLines(
                                    color: context.secondaryColor,
                                    size: 32,
                                  ),
                                )
                              : const SizedBox(),
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
                                      "Register with Apple",
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
                                    "Register with Google",
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
                              color: context.colorScheme.onBackground.withOpacity(0.5),
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
                              color: context.colorScheme.onBackground.withOpacity(0.5),
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
                                autofillHints: const [AutofillHints.newPassword],
                                autocorrect: false,
                                obscureText: !showPassword.value,
                                keyboardType: TextInputType.visiblePassword,
                                controller: passwordTextController,
                                focusNode: passwordFocusNode,
                                decoration: InputDecoration(
                                  hintText: "Password",
                                  suffixIcon: IconButton(
                                    onPressed: () {
                                      showPassword.value = !showPassword.value;
                                    },
                                    icon: FaIcon(
                                      showPassword.value ? FontAwesomeIcons.eye : FontAwesomeIcons.eyeSlash,
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
                                autofillHints: const [AutofillHints.newPassword],
                                autocorrect: false,
                                obscureText: !showConfirmPassword.value,
                                keyboardType: TextInputType.visiblePassword,
                                controller: confirmPasswordTextController,
                                focusNode: confirmPasswordFocusNode,
                                decoration: InputDecoration(
                                  hintText: "Confirm Password",
                                  suffixIcon: IconButton(
                                    onPressed: () {
                                      showConfirmPassword.value = !showConfirmPassword.value;
                                    },
                                    icon: FaIcon(
                                      showConfirmPassword.value ? FontAwesomeIcons.eye : FontAwesomeIcons.eyeSlash,
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
                          context.go('/auth/login');
                        },
                        child: Text(
                          "Already have an account?",
                          style: context.textTheme.bodySmall?.copyWith(
                            color: context.brightness == Brightness.light
                                ? context.primaryColor.withOpacity(0.6)
                                : context.secondaryColor,
                          ),
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
