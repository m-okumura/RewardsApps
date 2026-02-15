import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poi_app/config.dart';

class ShoppingTrackModel {
  final int id;
  final String merchant;
  final String? orderId;
  final int? amount;
  final String status;
  final String trackedAt;

  ShoppingTrackModel({
    required this.id,
    required this.merchant,
    this.orderId,
    this.amount,
    required this.status,
    required this.trackedAt,
  });

  factory ShoppingTrackModel.fromJson(Map<String, dynamic> json) {
    return ShoppingTrackModel(
      id: json['id'] as int,
      merchant: json['merchant'] as String,
      orderId: json['order_id'] as String?,
      amount: json['amount'] as int?,
      status: json['status'] as String? ?? 'pending',
      trackedAt: json['tracked_at'] as String,
    );
  }
}

class ShoppingService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<ShoppingTrackModel> trackPurchase(
    String merchant, {
    String? orderId,
    int? amount,
  }) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final body = <String, dynamic>{
      'merchant': merchant,
      if (orderId != null && orderId.isNotEmpty) 'order_id': orderId,
      if (amount != null) 'amount': amount,
    };

    final res = await http.post(
      Uri.parse('${Config.apiBaseUrl}/shopping/track'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? '登録に失敗しました');
    }
    return ShoppingTrackModel.fromJson(jsonDecode(res.body));
  }

  static Future<List<ShoppingTrackModel>> getHistory() async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/shopping/history'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('履歴の取得に失敗しました');

    final list = jsonDecode(res.body) as List;
    return list
        .map((e) => ShoppingTrackModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
