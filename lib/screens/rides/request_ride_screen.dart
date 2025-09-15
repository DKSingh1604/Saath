import 'package:flutter/material.dart';
import 'package:car_pool_app/models/ride.dart';
import 'package:car_pool_app/models/user.dart';
import 'package:car_pool_app/widgets/user_avatar.dart';

class RequestRideScreen extends StatefulWidget {
  final Ride ride;
  final User driver;

  const RequestRideScreen({
    super.key,
    required this.ride,
    required this.driver,
  });

  @override
  State<RequestRideScreen> createState() => _RequestRideScreenState();
}

class _RequestRideScreenState extends State<RequestRideScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _offerController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _offerController.text = widget.ride.contributionAmount.toInt().toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Ride'),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Ride summary card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        UserAvatar(user: widget.driver, radius: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ride with ${widget.driver.name}',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                widget.ride.dateTimeDisplay,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.tertiary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '\$${widget.ride.contributionAmount.toInt()}',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: Theme.of(context).colorScheme.onTertiary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          size: 16,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(widget.ride.fromLocation),
                        const SizedBox(width: 16),
                        Icon(
                          Icons.arrow_forward,
                          size: 16,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                        const SizedBox(width: 16),
                        Icon(
                          Icons.flag,
                          size: 16,
                          color: Theme.of(context).colorScheme.secondary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: Text(widget.ride.toLocation)),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              Text(
                'Request Details',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _pickupController,
                decoration: const InputDecoration(
                  labelText: 'Your pickup point',
                  hintText: 'e.g., Main Street Metro Station',
                  prefixIcon: Icon(Icons.my_location),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please specify your pickup point';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _offerController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: widget.ride.contributionType == ContributionType.negotiable
                      ? 'Your offer per seat (\$)'
                      : 'Contribution per seat (\$)',
                  prefixIcon: const Icon(Icons.attach_money),
                  suffixText: widget.ride.contributionType == ContributionType.negotiable
                      ? 'negotiable'
                      : null,
                ),
                enabled: widget.ride.contributionType == ContributionType.negotiable,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your contribution';
                  }
                  if (double.tryParse(value) == null) {
                    return 'Please enter a valid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _messageController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Message to driver (optional)',
                  hintText: 'Hi! I would like to join your ride...',
                  prefixIcon: Icon(Icons.message),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Important notes
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.secondaryContainer.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 20,
                          color: Theme.of(context).colorScheme.secondary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Please note',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Theme.of(context).colorScheme.secondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '• Be specific about your pickup location\n'
                      '• The driver will receive your request and can accept or decline\n'
                      '• You\'ll be notified once the driver responds\n'
                      '• Payment is handled in cash directly with the driver',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _sendRequest,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  label: Text(_isLoading ? 'Sending Request...' : 'Send Request'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _sendRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      // Show success dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            title: Row(
              children: [
                Icon(
                  Icons.check_circle,
                  color: Theme.of(context).colorScheme.secondary,
                ),
                const SizedBox(width: 8),
                const Text('Request Sent!'),
              ],
            ),
            content: Text(
              'Your ride request has been sent to ${widget.driver.name}. '
              'You\'ll receive a notification when they respond.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Close dialog
                  Navigator.of(context).pop(); // Go back to details
                  Navigator.of(context).pop(); // Go back to search
                },
                child: const Text('OK'),
              ),
            ],
          );
        },
      );
    }

    setState(() {
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _pickupController.dispose();
    _offerController.dispose();
    _messageController.dispose();
    super.dispose();
  }
}