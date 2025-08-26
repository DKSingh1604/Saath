import 'package:flutter/material.dart';
import 'package:car_pool_app/theme.dart';
import 'package:car_pool_app/services/auth_service.dart';
import 'package:car_pool_app/screens/auth/welcome_screen.dart';
import 'package:car_pool_app/screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AuthService.initialize();
  runApp(const CommuteTogether());
}

class CommuteTogether extends StatelessWidget {
  const CommuteTogether({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CommuteTogether',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
      home: AuthService.isAuthenticated
          ? const HomeScreen()
          : const WelcomeScreen(),
    );
  }
}
