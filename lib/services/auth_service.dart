import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:car_pool_app/models/user.dart';

class AuthService {
  // Dynamic base URL based on platform
  static String get baseUrl {
    if (Platform.isAndroid) {
      // For Android Emulator use 10.0.2.2:5000
      // For physical Android device, use your computer's IP
      return 'http://10.0.2.2:5000/api';
    } else if (Platform.isIOS) {
      return 'http://localhost:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }

  static String? _token;
  static User? _currentUser;

  // Getters
  static String? get token => _token;
  static User? get currentUser => _currentUser;
  static bool get isAuthenticated => _token != null;

  // Initialize service (load token from storage)
  static Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');

    if (_token != null) {
      try {
        await getCurrentUser();
      } catch (e) {
        // Token might be invalid, clear it
        await logout();
      }
    }
  }

  // Register user
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String city,
    DateTime? dateOfBirth,
    String? gender,
    bool? isDriver,
    File? profileImage,
    Map<String, dynamic>? preferences,
  }) async {
    try {
      print('Attempting to register with URL: $baseUrl/auth/register');

      // Prepare the request body
      final Map<String, dynamic> requestBody = {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
        'city': city,
      };

      // Add optional fields if provided
      if (dateOfBirth != null) {
        requestBody['dateOfBirth'] = dateOfBirth.toIso8601String();
      }
      if (gender != null) {
        requestBody['gender'] = gender;
      }
      if (isDriver != null) {
        requestBody['isDriver'] = isDriver;
      }
      if (preferences != null) {
        requestBody['preferences'] = preferences;
      }

      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(requestBody),
          )
          .timeout(const Duration(seconds: 10));

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.body.isEmpty) {
        return {'success': false, 'message': 'Empty response from server'};
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Handle successful registration
        if (data['data'] != null) {
          _token = data['data']['token'] as String?;
          if (data['data']['user'] != null) {
            _currentUser =
                User.fromJson(data['data']['user'] as Map<String, dynamic>);
          }
          if (_token != null) {
            await _saveToken();
          }
        }
        return {
          'success': true,
          'data': data['data'],
          'message': data['message'] ?? 'Registration successful'
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Registration failed'
        };
      }
    } catch (e) {
      print('Registration error: $e');
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Login user
  static Future<Map<String, dynamic>> login({
    required String credential, // email or phone
    required String password,
    String? fcmToken,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'credential': credential,
          'password': password,
          'fcmToken': fcmToken,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        _token = data['token'];
        _currentUser = User.fromJson(data['data']);
        await _saveToken();
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Verify email with OTP
  static Future<Map<String, dynamic>> verifyEmail({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-email'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
        }),
      );

      final data = jsonDecode(response.body);
      return {
        'success': response.statusCode == 200,
        'message': data['message'] ??
            (response.statusCode == 200
                ? 'Email verified successfully'
                : 'Verification failed')
      };
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Resend OTP
  static Future<Map<String, dynamic>> resendOtp(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/resend-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);
      return {
        'success': response.statusCode == 200,
        'message': data['message'] ??
            (response.statusCode == 200
                ? 'OTP sent successfully'
                : 'Failed to send OTP')
      };
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Forgot password
  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);
      return {
        'success': response.statusCode == 200,
        'message': data['message'] ??
            (response.statusCode == 200
                ? 'Reset link sent to email'
                : 'Failed to send reset link')
      };
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Update password
  static Future<Map<String, dynamic>> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    if (_token == null) {
      return {'success': false, 'message': 'Not authenticated'};
    }

    try {
      final response = await http.put(
        Uri.parse('$baseUrl/auth/update-password'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        _token = data['token'];
        await _saveToken();
        return {'success': true, 'message': 'Password updated successfully'};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Password update failed'
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Get current user profile
  static Future<Map<String, dynamic>> getCurrentUser() async {
    if (_token == null) {
      return {'success': false, 'message': 'Not authenticated'};
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        _currentUser = User.fromJson(data['data']);
        return {'success': true, 'data': _currentUser};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get user profile'
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Update user profile
  static Future<Map<String, dynamic>> updateProfile(
      Map<String, dynamic> updates) async {
    if (_token == null) {
      return {'success': false, 'message': 'Not authenticated'};
    }

    try {
      final response = await http.put(
        Uri.parse('$baseUrl/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode(updates),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        _currentUser = User.fromJson(data['data']);
        return {'success': true, 'data': _currentUser};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Profile update failed'
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Logout
  static Future<void> logout() async {
    if (_token != null) {
      try {
        await http.post(
          Uri.parse('$baseUrl/auth/logout'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $_token',
          },
        );
      } catch (e) {
        // Ignore errors during logout API call
      }
    }

    _token = null;
    _currentUser = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Private helper to save token
  static Future<void> _saveToken() async {
    if (_token != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
    }
  }

  // Get authorization headers
  static Map<String, String> getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
  }
}
