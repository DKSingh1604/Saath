import 'package:flutter/material.dart';

class RatingDisplay extends StatelessWidget {
  final double rating;
  final int totalRatings;
  final double size;
  final bool showCount;

  const RatingDisplay({
    super.key,
    required this.rating,
    this.totalRatings = 0,
    this.size = 16,
    this.showCount = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(5, (index) {
          if (index < rating.floor()) {
            return Icon(
              Icons.star,
              size: size,
              color: Colors.amber[600],
            );
          } else if (index < rating) {
            return Icon(
              Icons.star_half,
              size: size,
              color: Colors.amber[600],
            );
          } else {
            return Icon(
              Icons.star_border,
              size: size,
              color: Colors.grey[400],
            );
          }
        }),
        if (showCount) ...[
          const SizedBox(width: 4),
          Text(
            rating > 0 ? '${rating.toStringAsFixed(1)}' : 'New',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          if (totalRatings > 0) ...[
            Text(
              ' ($totalRatings)',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ],
      ],
    );
  }
}

class InteractiveRating extends StatefulWidget {
  final int initialRating;
  final Function(int) onRatingChanged;
  final double size;

  const InteractiveRating({
    super.key,
    this.initialRating = 0,
    required this.onRatingChanged,
    this.size = 24,
  });

  @override
  State<InteractiveRating> createState() => _InteractiveRatingState();
}

class _InteractiveRatingState extends State<InteractiveRating> {
  late int currentRating;

  @override
  void initState() {
    super.initState();
    currentRating = widget.initialRating;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        return GestureDetector(
          onTap: () {
            setState(() {
              currentRating = index + 1;
            });
            widget.onRatingChanged(currentRating);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Icon(
              index < currentRating ? Icons.star : Icons.star_border,
              size: widget.size,
              color: index < currentRating ? Colors.amber[600] : Colors.grey[400],
            ),
          ),
        );
      }),
    );
  }
}