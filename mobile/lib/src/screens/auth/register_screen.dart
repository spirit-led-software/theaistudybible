import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Api.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';
import 'package:url_launcher/url_launcher_string.dart';

class RegisterScreen extends HookConsumerWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextEditingController emailTextController =
        useTextEditingController();
    final TextEditingController passwordTextController =
        useTextEditingController();
    final TextEditingController confirmPasswordTextController =
        useTextEditingController();

    final pendingRegister = useState<Future<void>?>(null);
    final snapshot = useFuture(pendingRegister.value);
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
                    ? CircularProgressIndicator(
                        color: RAIColors.secondary,
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
                          final url =
                              "${Api.url}/auth/facebook-mobile/authorize";
                          await launchUrlString(
                            url,
                            mode: LaunchMode.externalApplication,
                          );
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
                          final url = "${Api.url}/auth/google-mobile/authorize";
                          await launchUrlString(
                            url,
                            mode: LaunchMode.externalApplication,
                          );
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
                TextField(
                  autofocus: true,
                  autocorrect: false,
                  keyboardType: TextInputType.emailAddress,
                  controller: emailTextController,
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
                const SizedBox(
                  height: 10,
                ),
                TextField(
                  autofocus: true,
                  autocorrect: false,
                  obscureText: !showPassword.value,
                  keyboardType: TextInputType.visiblePassword,
                  controller: passwordTextController,
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
                  autofocus: true,
                  autocorrect: false,
                  obscureText: !showConfirmPassword.value,
                  keyboardType: TextInputType.visiblePassword,
                  controller: confirmPasswordTextController,
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
                        showConfirmPassword.value = !showConfirmPassword.value;
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
                          if (emailTextController.value.text.isEmpty ||
                              passwordTextController.value.text.isEmpty ||
                              confirmPasswordTextController
                                  .value.text.isEmpty) {
                            alert.value = Alert(
                              message: "Please fill in all fields",
                              type: AlertType.error,
                            );
                            return;
                          }

                          if (passwordTextController.value.text !=
                              confirmPasswordTextController.value.text) {
                            alert.value = Alert(
                              message: "Passwords do not match",
                              type: AlertType.error,
                            );
                            return;
                          }

                          final future = ref
                              .read(currentUserProvider.notifier)
                              .register(emailTextController.value.text,
                                  passwordTextController.value.text)
                              .then((value) {
                            alert.value = Alert(
                              message:
                                  "Check your email for a verification link.",
                              type: AlertType.success,
                            );
                          });
                          pendingRegister.value = future;
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
    );
  }
}
