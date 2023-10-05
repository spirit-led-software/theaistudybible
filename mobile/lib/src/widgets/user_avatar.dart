import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/widgets/network_image.dart';

class UserAvatar extends HookConsumerWidget {
  final double radius;
  final Color backgroundColor;

  const UserAvatar({
    Key? key,
    this.radius = 25,
    this.backgroundColor = Colors.grey,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return CircleAvatar(
      radius: radius,
      backgroundColor: backgroundColor,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(100),
        child: RAINetworkImage(
          imageUrl: currentUser.requireValue.image,
          fallbackText:
              currentUser.requireValue.name?.substring(0, 1).toUpperCase() ??
                  currentUser.requireValue.email.substring(0, 1).toUpperCase(),
          fallbackTextSize: radius * 0.75,
        ),
      ),
    );
  }
}
