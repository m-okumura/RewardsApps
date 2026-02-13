import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:poi_app/config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FitnessPointsModel {
  final int totalSteps;
  final int availableBottles;
  final int consumedBottles;
  final int pointsFromBottles;
  final int balance;
  final int stepsPerBottle;
  final int pointsPerBottle;

  FitnessPointsModel({
    required this.totalSteps,
    required this.availableBottles,
    required this.consumedBottles,
    required this.pointsFromBottles,
    required this.balance,
    required this.stepsPerBottle,
    required this.pointsPerBottle,
  });

  factory FitnessPointsModel.fromJson(Map<String, dynamic> json) {
    return FitnessPointsModel(
      totalSteps: json['total_steps'] as int,
      availableBottles: json['available_bottles'] as int,
      consumedBottles: json['consumed_bottles'] as int,
      pointsFromBottles: json['points_from_bottles'] as int,
      balance: json['balance'] as int,
      stepsPerBottle: json['steps_per_bottle'] as int? ?? 10000,
      pointsPerBottle: json['points_per_bottle'] as int? ?? 10,
    );
  }
}

class FitnessService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<void> registerSteps(int steps, {String? targetDate}) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    var url = '${Config.apiBaseUrl}/fitness/steps';
    if (targetDate != null) {
      url += '?target_date=$targetDate';
    }
    final res = await http.post(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'steps': steps}),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? '歩数の登録に失敗しました');
    }
  }

  static Future<FitnessPointsModel> getPoints() async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/fitness/points'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('データの取得に失敗しました');
    return FitnessPointsModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<Map<String, dynamic>> consumeBottles(int bottles) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.post(
      Uri.parse('${Config.apiBaseUrl}/fitness/consume'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'bottles': bottles}),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'ボトル消費に失敗しました');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<List<Map<String, dynamic>>> getStepsHistory({int days = 7}) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/fitness/steps/history?days=$days'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('履歴の取得に失敗しました');
    final list = jsonDecode(res.body) as List;
    return list.map((e) => e as Map<String, dynamic>).toList();
  }
}
