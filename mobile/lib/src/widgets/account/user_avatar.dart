import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:revelationsai/src/widgets/network_image.dart';

class UserAvatar extends HookConsumerWidget {
  final double radius;
  final Color backgroundColor;
  final Widget Function(BuildContext context)? badgeBuilder;

  const UserAvatar({
    super.key,
    this.radius = 25,
    this.backgroundColor = Colors.grey,
    this.badgeBuilder,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return Stack(
      children: [
        CircleAvatar(
          radius: radius,
          child: Container(
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(100),
              boxShadow: [
                BoxShadow(
                  color: context.theme.shadowColor.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(100),
              child: RAINetworkImage(
                imageUrl: currentUser.requireValue.image,
                fallbackText: currentUser.requireValue.name
                        ?.substring(0, 1)
                        .toUpperCase() ??
                    currentUser.requireValue.email
                        .substring(0, 1)
                        .toUpperCase(),
                fallbackTextSize: radius * 0.75,
              ),
            ),
          ),
        ),
        if (badgeBuilder != null) ...[
          Positioned(
            bottom: 0,
            right: 0,
            child: CircleAvatar(
              radius: radius * 0.3,
              backgroundColor: context.secondaryColor,
              child: badgeBuilder!(context),
            ),
          ),
        ],
      ],
    );
  }
}
