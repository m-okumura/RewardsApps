import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poi_app/config.dart';

class ReferralCodeModel {
  final String referralCode;
  final String shareUrl;

  ReferralCodeModel({
    required this.referralCode,
    required this.shareUrl,
  });

  factory ReferralCodeModel.fromJson(Map<String, dynamic> json) {
    return ReferralCodeModel(
      referralCode: json['referral_code'] as String,
      shareUrl: json['share_url'] as String? ?? '',
    );
  }
}

class ReferralHistoryItem {
  final int id;
  final int referredId;
  final int pointsAwarded;
  final String createdAt;

  ReferralHistoryItem({
    required this.id,
    required this.referredId,
    required this.pointsAwarded,
    required this.createdAt,
  });

  factory ReferralHistoryItem.fromJson(Map<String, dynamic> json) {
    return ReferralHistoryItem(
      id: json['id'] as int,
      referredId: json['referred_id'] as int,
      pointsAwarded: json['points_awarded'] as int,
      createdAt: json['created_at'] as String,
    );
  }
}

class ReferralService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<ReferralCodeModel> getMyCode() async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/referrals/my-code'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('紹介コードの取得に失敗しました');
    return ReferralCodeModel.fromJson(jsonDecode(res.body));
  }

  static Future<List<ReferralHistoryItem>> getHistory() async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/referrals/history'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('履歴の取得に失敗しました');

    final list = jsonDecode(res.body) as List;
    return list
        .map((e) => ReferralHistoryItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
