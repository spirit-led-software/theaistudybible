import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/screens/account/settings_modal.dart';
import 'package:revelationsai/src/widgets/user_avatar.dart';

class AccountScreen extends HookConsumerWidget {
  const AccountScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        floatingActionButtonLocation: FloatingActionButtonLocation.miniEndTop,
        floatingActionButton: Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: RAIColors.secondary,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: IconButton(
            onPressed: () {
              showModalBottomSheet(
                elevation: 20,
                isScrollControlled: true,
                context: context,
                backgroundColor: Colors.white,
                builder: (_) => const FractionallySizedBox(
                  heightFactor: 0.90,
                  widthFactor: 1,
                  child: SettingsModal(),
                ),
              );
            },
            icon: const FaIcon(
              FontAwesomeIcons.gear,
              color: Colors.white,
            ),
          ),
        ),
        body: Stack(
          children: [
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const UserAvatar(
                    radius: 50,
                  ),
                  const SizedBox(
                    height: 10,
                  ),
                  Text(
                    currentUser.requireValue.name ??
                        currentUser.requireValue.email,
                    style: const TextStyle(
                      fontSize: 20,
                    ),
                  ),
                  Text(
                    currentUser.requireValue.email,
                    style: const TextStyle(
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(
                    height: 30,
                  ),
                  Text(
                    '${currentUser.requireValue.remainingQueries}/${currentUser.requireValue.maxQueries} Queries Remaining',
                    style: TextStyle(
                      color: currentUser.requireValue.remainingQueries <= 3
                          ? Colors.red
                          : RAIColors.primary,
                    ),
                  ),
                  const SizedBox(
                    height: 5,
                  ),
                  TextButton(
                    style: TextButton.styleFrom(
                      backgroundColor: RAIColors.secondary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        vertical: 15,
                        horizontal: 50,
                      ),
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.all(
                          Radius.circular(10),
                        ),
                      ),
                      shadowColor: Colors.black.withOpacity(0.2),
                      elevation: 20,
                    ),
                    onPressed: () {
                      context.go("/upgrade");
                    },
                    child: const Text("Upgrade"),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 50,
              left: MediaQuery.of(context).size.width * 0.25,
              right: MediaQuery.of(context).size.width * 0.25,
              child: Container(
                padding: const EdgeInsets.only(
                  top: 15,
                  bottom: 15,
                  left: 10,
                  right: 10,
                ),
                decoration: BoxDecoration(
                  color: RAIColors.secondary,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.info,
                      color: Colors.white,
                    ),
                    SizedBox(
                      width: 10,
                    ),
                    Flexible(
                      child: Text(
                        "Account Editing Coming Soon!",
                        softWrap: true,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
