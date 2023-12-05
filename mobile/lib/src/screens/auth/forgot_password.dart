import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class ForgotPasswordScreen extends HookConsumerWidget {
  final String? token;

  const ForgotPasswordScreen({super.key, this.token});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextEditingController emailTextController = useTextEditingController();
    final emailFocusNode = useFocusNode();

    final TextEditingController passwordTextController = useTextEditingController();
    final passwordFocusNode = useFocusNode();

    final TextEditingController confirmPasswordTextController = useTextEditingController();
    final confirmPasswordFocusNode = useFocusNode();

    final pending = useState<Future<void>?>(null);
    final snapshot = useFuture(pending.value);
    final alert = useState<Alert?>(null);

    final showPassword = useState(false);
    final showConfirmPassword = useState(false);

    final isLoading = !snapshot.hasData && !snapshot.hasError && snapshot.connectionState == ConnectionState.waiting;

    final handleSubmit = useCallback(
      () async {
        if (token == null) {
          if (emailTextController.text.isEmpty) {
            alert.value = Alert(
              message: "Email is required",
              type: AlertType.error,
            );
            return;
          }
          pending.value = ref
              .read(currentUserProvider.notifier)
              .forgotPassword(
                emailTextController.text,
              )
              .then((value) {
            alert.value = Alert(
              message: "Password reset email sent",
              type: AlertType.success,
            );
          }).catchError((error) {
            alert.value = Alert(
              message: error.toString(),
              type: AlertType.error,
            );
          });
          await pending.value;
        } else {
          if (passwordTextController.text != confirmPasswordTextController.text) {
            alert.value = Alert(
              message: "Passwords do not match",
              type: AlertType.error,
            );
            return;
          }

          pending.value = ref
              .read(currentUserProvider.notifier)
              .resetPassword(
                token!,
                passwordTextController.text,
              )
              .then((value) {
            context.go('/auth/login?resetPassword=success');
          }).catchError((error) {
            alert.value = Alert(
              message: error.toString(),
              type: AlertType.error,
            );
          });
          await pending.value;
        }
      },
      [
        token,
        emailTextController.text,
        passwordTextController.text,
        confirmPasswordTextController.text,
      ],
    );

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
            child: SafeArea(
              child: SingleChildScrollView(
                child: Container(
                  padding: const EdgeInsets.only(
                    left: 20,
                    right: 20,
                    bottom: 40,
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
                                    color: context.colorScheme.secondary,
                                    size: 32,
                                  ),
                                )
                              : const SizedBox(),
                      if (token == null) ...[
                        AutofillGroup(
                          child: TextField(
                            autofillHints: const [AutofillHints.email],
                            autocorrect: false,
                            keyboardType: TextInputType.emailAddress,
                            controller: emailTextController,
                            focusNode: emailFocusNode,
                            onTapOutside: (event) {
                              emailFocusNode.unfocus();
                            },
                            onSubmitted: (value) {
                              emailFocusNode.unfocus();
                            },
                            decoration: const InputDecoration(
                              hintText: "Email",
                            ),
                          ),
                        ),
                      ],
                      if (token != null) ...[
                        AutofillGroup(
                          child: Column(
                            children: [
                              TextField(
                                autofillHints: const [AutofillHints.newPassword],
                                autocorrect: false,
                                obscureText: !showPassword.value,
                                keyboardType: TextInputType.visiblePassword,
                                controller: passwordTextController,
                                focusNode: passwordFocusNode,
                                onTapOutside: (event) {
                                  passwordFocusNode.unfocus();
                                },
                                onSubmitted: (value) {
                                  passwordFocusNode.unfocus();
                                },
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
                              ),
                              const SizedBox(
                                height: 10,
                              ),
                              TextField(
                                autofillHints: const [AutofillHints.newPassword],
                                autocorrect: false,
                                obscureText: !showConfirmPassword.value,
                                keyboardType: TextInputType.visiblePassword,
                                controller: confirmPasswordTextController,
                                focusNode: confirmPasswordFocusNode,
                                onTapOutside: (event) {
                                  confirmPasswordFocusNode.unfocus();
                                },
                                onSubmitted: (value) {
                                  confirmPasswordFocusNode.unfocus();
                                },
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
                              ),
                            ],
                          ),
                        ),
                      ],
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
                                "Submit",
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(
                        height: 10,
                      ),
                      GestureDetector(
                        onTap: () {
                          context.go('/auth/login');
                        },
                        child: Text(
                          "Know your password?",
                          style: TextStyle(
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
