import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:poi_app/config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PointTransactionModel {
  final int id;
  final int amount;
  final String type;
  final String? description;
  final String createdAt;

  PointTransactionModel({
    required this.id,
    required this.amount,
    required this.type,
    this.description,
    required this.createdAt,
  });

  factory PointTransactionModel.fromJson(Map<String, dynamic> json) {
    return PointTransactionModel(
      id: json['id'] as int,
      amount: json['amount'] as int,
      type: json['type'] as String,
      description: json['description'] as String?,
      createdAt: json['created_at'] as String,
    );
  }
}

class ExchangeOptionModel {
  final String id;
  final String name;
  final int minAmount;
  final String? description;

  ExchangeOptionModel({
    required this.id,
    required this.name,
    required this.minAmount,
    this.description,
  });

  factory ExchangeOptionModel.fromJson(Map<String, dynamic> json) {
    return ExchangeOptionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      minAmount: json['min_amount'] as int,
      description: json['description'] as String?,
    );
  }
}

class PointService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<int> getBalance() async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/points/balance'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('残高の取得に失敗しました');
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['balance'] as int;
  }

  static Future<List<PointTransactionModel>> getHistory({int skip = 0, int limit = 50}) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/points/history?skip=$skip&limit=$limit'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('履歴の取得に失敗しました');

    final list = jsonDecode(res.body) as List;
    return list.map((e) => PointTransactionModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<List<ExchangeOptionModel>> getExchangeOptions() async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/points/exchange-options'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('交換先の取得に失敗しました');

    final list = jsonDecode(res.body) as List;
    return list.map((e) => ExchangeOptionModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<void> requestExchange(int amount, String destination, {String? destinationDetail}) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final body = <String, dynamic>{
      'amount': amount,
      'destination': destination,
    };
    if (destinationDetail != null && destinationDetail.isNotEmpty) {
      body['destination_detail'] = destinationDetail;
    }

    final res = await http.post(
      Uri.parse('${Config.apiBaseUrl}/points/exchange'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? '交換申請に失敗しました');
    }
  }
}
