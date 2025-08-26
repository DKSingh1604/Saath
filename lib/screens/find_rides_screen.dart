import 'package:flutter/material.dart';
import 'package:car_pool_app/models/ride.dart';
import 'package:car_pool_app/models/user.dart';
import 'package:car_pool_app/services/sample_data.dart';
import 'package:car_pool_app/widgets/ride_card.dart';
import 'package:car_pool_app/screens/ride_details_screen.dart';

class FindRidesScreen extends StatefulWidget {
  const FindRidesScreen({super.key});

  @override
  State<FindRidesScreen> createState() => _FindRidesScreenState();
}

class _FindRidesScreenState extends State<FindRidesScreen> {
  final TextEditingController _fromController = TextEditingController();
  final TextEditingController _toController = TextEditingController();
  DateTime? _selectedDate;
  List<Ride> _filteredRides = [];

  @override
  void initState() {
    super.initState();
    _filteredRides = SampleData.availableRides;
  }

  void _filterRides() {
    setState(() {
      _filteredRides = SampleData.availableRides.where((ride) {
        bool matchesFrom = _fromController.text.isEmpty || 
            ride.fromLocation.toLowerCase().contains(_fromController.text.toLowerCase());
        bool matchesTo = _toController.text.isEmpty || 
            ride.toLocation.toLowerCase().contains(_toController.text.toLowerCase());
        bool matchesDate = _selectedDate == null || 
            (ride.date.year == _selectedDate!.year &&
             ride.date.month == _selectedDate!.month &&
             ride.date.day == _selectedDate!.day);
        
        return matchesFrom && matchesTo && matchesDate;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Rides'),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search filters
          Container(
            padding: const EdgeInsets.all(20),
            color: Theme.of(context).colorScheme.surface,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _fromController,
                        decoration: const InputDecoration(
                          hintText: 'From',
                          prefixIcon: Icon(Icons.location_on),
                        ),
                        onChanged: (_) => _filterRides(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _toController,
                        decoration: const InputDecoration(
                          hintText: 'To',
                          prefixIcon: Icon(Icons.flag),
                        ),
                        onChanged: (_) => _filterRides(),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 30)),
                          );
                          if (date != null) {
                            setState(() {
                              _selectedDate = date;
                            });
                            _filterRides();
                          }
                        },
                        icon: const Icon(Icons.calendar_today),
                        label: Text(
                          _selectedDate != null 
                              ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                              : 'Select Date',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    if (_selectedDate != null)
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _selectedDate = null;
                          });
                          _filterRides();
                        },
                        icon: const Icon(Icons.clear),
                        color: Theme.of(context).colorScheme.error,
                      ),
                  ],
                ),
              ],
            ),
          ),
          // Results header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3),
            child: Row(
              children: [
                Icon(
                  Icons.directions_car,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  '${_filteredRides.length} rides available',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          // Rides list
          Expanded(
            child: _filteredRides.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No rides found',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Try adjusting your search filters',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _filteredRides.length,
                    itemBuilder: (context, index) {
                      final ride = _filteredRides[index];
                      final driver = SampleData.getUserById(ride.driverId)!;
                      
                      return RideCard(
                        ride: ride,
                        driver: driver,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => RideDetailsScreen(
                                ride: ride,
                                driver: driver,
                                showRequestButton: true,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    super.dispose();
  }
}