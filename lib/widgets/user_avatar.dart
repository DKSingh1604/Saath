import 'package:flutter/material.dart';
import 'package:car_pool_app/models/user.dart';

class UserAvatar extends StatelessWidget {
  final User user;
  final double radius;
  final bool showVerificationBadge;

  const UserAvatar({
    super.key,
    required this.user,
    this.radius = 24,
    this.showVerificationBadge = true,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CircleAvatar(
          radius: radius,
          backgroundImage: user.profilePicture != null
              ? NetworkImage(user.profilePicture!)
              : null,
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
          child: user.profilePicture == null
              ? Text(
                  user.name[0].toUpperCase(),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                        fontSize: radius * 0.6,
                        fontWeight: FontWeight.w600,
                      ),
                )
              : null,
        ),
        if (showVerificationBadge && user.isVerified.isBasicVerified)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.verified,
                size: radius * 0.4,
                color: Theme.of(context).colorScheme.secondary,
              ),
            ),
          ),
      ],
    );
  }
}
