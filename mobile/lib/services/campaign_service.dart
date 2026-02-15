import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poi_app/config.dart';

class CampaignModel {
  final int id;
  final String title;
  final String campaignType;
  final String? description;
  final int? points;
  final String? startAt;
  final String? endAt;
  final bool isActive;

  CampaignModel({
    required this.id,
    required this.title,
    required this.campaignType,
    this.description,
    this.points,
    this.startAt,
    this.endAt,
    required this.isActive,
  });

  factory CampaignModel.fromJson(Map<String, dynamic> json) {
    return CampaignModel(
      id: json['id'] as int,
      title: json['title'] as String,
      campaignType: json['campaign_type'] as String? ?? 'general',
      description: json['description'] as String?,
      points: json['points'] as int?,
      startAt: json['start_at'] as String?,
      endAt: json['end_at'] as String?,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

class CampaignService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<List<CampaignModel>> getCampaigns() async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/campaigns'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('キャンペーンの取得に失敗しました');

    final list = jsonDecode(res.body) as List;
    return list
        .map((e) => CampaignModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
