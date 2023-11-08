import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/constants/visual_density.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/screens/account/settings_modal.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/account/change_password_dialog.dart';
import 'package:revelationsai/src/widgets/account/edit_email_dialog.dart';
import 'package:revelationsai/src/widgets/account/rename_dialog.dart';
import 'package:revelationsai/src/widgets/account/user_avatar.dart';

class AccountScreen extends HookConsumerWidget {
  const AccountScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider).requireValue;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: context.isDarkMode ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
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
                  UserAvatar(
                    radius: 50,
                    badgeBuilder: (context) {
                      return IconButton(
                        visualDensity: RAIVisualDensity.tightest,
                        onPressed: () async {
                          if (ImagePicker().supportsImageSource(
                            ImageSource.gallery,
                          )) {
                            final image = await ImagePicker().pickImage(
                              source: ImageSource.gallery,
                            );

                            if (image != null) {
                              final croppedImage = await ImageCropper().cropImage(
                                  sourcePath: image.path,
                                  maxHeight: 512,
                                  maxWidth: 512,
                                  cropStyle: CropStyle.circle,
                                  aspectRatioPresets: [
                                    CropAspectRatioPreset.square,
                                  ],
                                  uiSettings: [
                                    IOSUiSettings(
                                      title: 'Crop Image',
                                    ),
                                    AndroidUiSettings(
                                      toolbarTitle: 'Crop Image',
                                    )
                                  ]);

                              if (croppedImage != null) {
                                ref.read(currentUserProvider.notifier).updateUserImage(croppedImage);
                              }
                            }
                          }
                        },
                        icon: Icon(
                          Icons.edit,
                          color: context.colorScheme.onSecondary,
                        ),
                        iconSize: 15,
                        color: context.secondaryColor,
                      );
                    },
                  ),
                  const SizedBox(
                    height: 20,
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: context.width * 0.1,
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: Text.rich(
                                TextSpan(
                                  text: "Name:",
                                  children: [
                                    const WidgetSpan(
                                      child: SizedBox(
                                        width: 10,
                                      ),
                                    ),
                                    TextSpan(
                                      text: currentUser.name ?? currentUser.email,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                softWrap: false,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                showDialog(
                                  barrierDismissible: false,
                                  context: context,
                                  builder: (context) {
                                    return const RenameDialog();
                                  },
                                );
                              },
                              icon: const Icon(Icons.edit),
                            )
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: Text.rich(
                                TextSpan(
                                  text: "Email:",
                                  children: [
                                    const WidgetSpan(
                                      child: SizedBox(
                                        width: 10,
                                      ),
                                    ),
                                    TextSpan(
                                      text: currentUser.email,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                softWrap: false,
                                overflow: TextOverflow.fade,
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                showDialog(
                                  barrierDismissible: false,
                                  context: context,
                                  builder: (context) {
                                    return const EditEmailDialog();
                                  },
                                );
                              },
                              icon: const Icon(Icons.edit),
                            )
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Flexible(
                              child: Text.rich(
                                TextSpan(
                                  text: "Password:",
                                  children: [
                                    WidgetSpan(
                                      child: SizedBox(
                                        width: 10,
                                      ),
                                    ),
                                    TextSpan(
                                      text: "***********",
                                      style: TextStyle(
                                        fontWeight: FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ),
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                softWrap: false,
                                overflow: TextOverflow.fade,
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                showDialog(
                                  barrierDismissible: false,
                                  context: context,
                                  builder: (context) {
                                    return const ChangePasswordDialog();
                                  },
                                );
                              },
                              icon: const Icon(Icons.edit),
                            )
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(
                    height: 30,
                  ),
                  Text(
                    '${currentUser.remainingQueries}/${currentUser.maxQueries}',
                    style: TextStyle(
                      color: currentUser.remainingQueries <= 3 ? Colors.red : null,
                    ),
                  ),
                  Text(
                    'Queries Remaining',
                    style: TextStyle(
                      color: currentUser.remainingQueries <= 3 ? Colors.red : null,
                    ),
                  ),
                  const SizedBox(
                    height: 5,
                  ),
                  Text(
                    '${currentUser.remainingGeneratedImages}/${currentUser.maxGeneratedImages}',
                    style: TextStyle(
                      color: currentUser.remainingGeneratedImages <= 3 ? Colors.red : null,
                    ),
                  ),
                  Text(
                    'Images Remaining',
                    style: TextStyle(
                      color: currentUser.remainingGeneratedImages <= 3 ? Colors.red : null,
                    ),
                  ),
                  const SizedBox(
                    height: 10,
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
          ],
        ),
      ),
    );
  }
}
