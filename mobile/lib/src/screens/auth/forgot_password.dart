import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/branding/circular_logo.dart';

class ForgotPasswordScreen extends HookConsumerWidget {
  final String? token;

  const ForgotPasswordScreen({Key? key, this.token}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextEditingController emailTextController =
        useTextEditingController();
    final emailFocusNode = useFocusNode();

    final TextEditingController passwordTextController =
        useTextEditingController();
    final passwordFocusNode = useFocusNode();

    final TextEditingController confirmPasswordTextController =
        useTextEditingController();
    final confirmPasswordFocusNode = useFocusNode();

    final pending = useState<Future<void>?>(null);
    final snapshot = useFuture(pending.value);
    final alert = useState<Alert?>(null);

    final showPassword = useState(false);
    final showConfirmPassword = useState(false);

    void handleSubmit() {
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
        });
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
        });
      }
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
                          color: context.colorScheme.secondary,
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
                    child: const Text(
                      "Know your password?",
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
