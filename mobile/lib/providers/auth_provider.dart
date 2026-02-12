import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poi_app/config.dart';

class UserModel {
  final int id;
  final String email;
  final String name;
  final String? nickname;
  final bool isActive;
  final bool isVerified;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.nickname,
    required this.isActive,
    required this.isVerified,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      email: json['email'] as String,
      name: json['name'] as String,
      nickname: json['nickname'] as String?,
      isActive: json['is_active'] as bool,
      isVerified: json['is_verified'] as bool,
    );
  }
}

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _accessToken;
  bool _loading = false;

  UserModel? get user => _user;
  String? get accessToken => _accessToken;
  bool get isLoading => _loading;
  bool get isAuthenticated => _accessToken != null;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    if (_accessToken != null) {
      await fetchUser();
    }
    notifyListeners();
  }

  Future<void> _saveTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', accessToken);
    await prefs.setString('refresh_token', refreshToken);
    _accessToken = accessToken;
  }

  Future<void> _clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    _accessToken = null;
    _user = null;
  }

  Future<Map<String, String>> _headers({bool withAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (withAuth && _accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  Future<void> register(String email, String password, String name) async {
    _loading = true;
    notifyListeners();
    try {
      final res = await http.post(
        Uri.parse('${Config.apiBaseUrl}/auth/register'),
        headers: await _headers(withAuth: false),
        body: jsonEncode({
          'email': email,
          'password': password,
          'name': name,
        }),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        await _saveTokens(data['access_token'], data['refresh_token']);
        await fetchUser();
      } else {
        throw Exception(data['detail'] ?? '登録に失敗しました');
      }
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final res = await http.post(
        Uri.parse('${Config.apiBaseUrl}/auth/login'),
        headers: await _headers(withAuth: false),
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        await _saveTokens(data['access_token'], data['refresh_token']);
        await fetchUser();
      } else {
        throw Exception(data['detail'] ?? 'ログインに失敗しました');
      }
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> fetchUser() async {
    if (_accessToken == null) return;
    try {
      final res = await http.get(
        Uri.parse('${Config.apiBaseUrl}/users/me'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) {
        _user = UserModel.fromJson(jsonDecode(res.body));
      } else {
        await _clearTokens();
      }
    } catch (_) {
      await _clearTokens();
    }
    notifyListeners();
  }

  Future<void> logout() async {
    await _clearTokens();
    notifyListeners();
  }
}
