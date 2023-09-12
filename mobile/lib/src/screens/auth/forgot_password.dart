import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class ForgotPasswordScreen extends HookConsumerWidget {
  final String? token;

  const ForgotPasswordScreen({Key? key, this.token}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextEditingController emailTextController =
        useTextEditingController();
    final TextEditingController passwordTextController =
        useTextEditingController();
    final TextEditingController confirmPasswordTextController =
        useTextEditingController();

    final pending = useState<Future<void>?>(null);
    final snapshot = useFuture(pending.value);
    final alert = useState<Alert?>(null);

    final showPassword = useState(false);
    final showConfirmPassword = useState(false);

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
                if (token == null)
                  TextField(
                    autocorrect: false,
                    keyboardType: TextInputType.emailAddress,
                    controller: emailTextController,
                    onTapOutside: (event) {
                      FocusScope.of(context).unfocus();
                    },
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
                  ),
                if (token != null) ...[
                  TextField(
                    autocorrect: false,
                    obscureText: !showPassword.value,
                    keyboardType: TextInputType.visiblePassword,
                    controller: passwordTextController,
                    onTapOutside: (event) {
                      FocusScope.of(context).unfocus();
                    },
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
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  TextField(
                    autocorrect: false,
                    obscureText: !showConfirmPassword.value,
                    keyboardType: TextInputType.visiblePassword,
                    controller: confirmPasswordTextController,
                    onTapOutside: (event) {
                      FocusScope.of(context).unfocus();
                    },
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
                          if (token == null) {
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
                            if (passwordTextController.text !=
                                confirmPasswordTextController.text) {
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
                        },
                        child: const Text(
                          "Submit",
                          style: TextStyle(
                            color: Colors.white,
                          ),
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
                    "Know your password? Login here",
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
    );
  }
}
