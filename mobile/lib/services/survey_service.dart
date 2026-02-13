import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:poi_app/config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SurveyModel {
  final int id;
  final String title;
  final String? description;
  final int points;
  final String? expiresAt;
  final String createdAt;

  SurveyModel({
    required this.id,
    required this.title,
    this.description,
    required this.points,
    this.expiresAt,
    required this.createdAt,
  });

  factory SurveyModel.fromJson(Map<String, dynamic> json) {
    return SurveyModel(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      points: json['points'] as int,
      expiresAt: json['expires_at'] as String?,
      createdAt: json['created_at'] as String,
    );
  }
}

class SurveyService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<List<SurveyModel>> getSurveys({int skip = 0, int limit = 20}) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/surveys?skip=$skip&limit=$limit'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('アンケートの取得に失敗しました');

    final list = jsonDecode(res.body) as List;
    return list.map((e) => SurveyModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<SurveyModel> getSurvey(int id) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/surveys/$id'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('アンケートの取得に失敗しました');
    return SurveyModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<bool> hasAnswered(int surveyId) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/surveys/$surveyId/answered'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) return false;
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['answered'] as bool? ?? false;
  }

  static Future<int> submitAnswer(int surveyId, {Map<String, dynamic>? answers}) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.post(
      Uri.parse('${Config.apiBaseUrl}/surveys/$surveyId/answers'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'answers': answers ?? {}}),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? '回答の送信に失敗しました');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['points_awarded'] as int;
  }
}
