import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/Colors.dart';
import 'package:revelationsai/src/providers/user.dart';
import 'package:revelationsai/src/widgets/branding/logo.dart';

class LoginScreen extends HookConsumerWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextEditingController emailTextController =
        useTextEditingController();
    final TextEditingController passwordTextController =
        useTextEditingController();

    final pendingLogin = useState<Future<void>?>(null);
    final snapshot = useFuture(pendingLogin.value);

    final isErrored = snapshot.hasError &&
        snapshot.connectionState != ConnectionState.waiting;

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
                    : isErrored
                        ? Container(
                            padding: const EdgeInsets.all(10),
                            child: Text(
                              "Login failed ${snapshot.error}",
                              style: const TextStyle(
                                color: Colors.white,
                                backgroundColor: Colors.red,
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
                      borderRadius: BorderRadius.circular(1),
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
                  obscureText: true,
                  keyboardType: TextInputType.emailAddress,
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
                  ),
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
                          final future = ref
                              .read(currentUserProvider.notifier)
                              .login(emailTextController.value.text,
                                  passwordTextController.value.text);
                          pendingLogin.value = future;
                        },
                        child: const Text(
                          "Login",
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
        ),
      ),
    );
  }
}
