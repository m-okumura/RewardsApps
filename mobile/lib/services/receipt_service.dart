import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:poi_app/config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ReceiptModel {
  final int id;
  final int userId;
  final String imageUrl;
  final String storeName;
  final int amount;
  final String? items;
  final String? purchasedAt;
  final String status;
  final int? pointsAwarded;
  final String? rejectionReason;
  final String createdAt;

  ReceiptModel({
    required this.id,
    required this.userId,
    required this.imageUrl,
    required this.storeName,
    required this.amount,
    this.items,
    this.purchasedAt,
    required this.status,
    this.pointsAwarded,
    this.rejectionReason,
    required this.createdAt,
  });

  factory ReceiptModel.fromJson(Map<String, dynamic> json) {
    return ReceiptModel(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      imageUrl: json['image_url'] as String,
      storeName: json['store_name'] as String,
      amount: json['amount'] as int,
      items: json['items'] as String?,
      purchasedAt: json['purchased_at'] as String?,
      status: json['status'] as String,
      pointsAwarded: json['points_awarded'] as int?,
      rejectionReason: json['rejection_reason'] as String?,
      createdAt: json['created_at'] as String,
    );
  }
}

class ReceiptService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<List<ReceiptModel>> getReceipts({int skip = 0, int limit = 20}) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/receipts?skip=$skip&limit=$limit'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('レシートの取得に失敗しました');

    final list = jsonDecode(res.body) as List;
    return list.map((e) => ReceiptModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<ReceiptModel> getReceipt(int id) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final res = await http.get(
      Uri.parse('${Config.apiBaseUrl}/receipts/$id'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode != 200) throw Exception('レシートの取得に失敗しました');

    return ReceiptModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<ReceiptModel> uploadReceipt(File image, String storeName, int amount) async {
    final token = await _getToken();
    if (token == null) throw Exception('ログインが必要です');

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${Config.apiBaseUrl}/receipts'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath('image', image.path));
    request.fields['store_name'] = storeName;
    request.fields['amount'] = amount.toString();

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);

    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'レシートの登録に失敗しました');
    }

    return ReceiptModel.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}
