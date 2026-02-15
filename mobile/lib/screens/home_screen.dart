import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/services/fitness_service.dart';
import 'package:poi_app/services/point_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int? _balance;
  FitnessPointsModel? _fitness;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final balance = await PointService.getBalance();
      final fitness = await FitnessService.getPoints();
      if (mounted) {
        setState(() {
          _balance = balance;
          _fitness = fitness;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ポイ活アプリ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: ListTile(
                leading: const Icon(Icons.receipt_long),
                title: const Text('レシート'),
                subtitle: const Text('レシートを撮影してポイントを貯めよう'),
                onTap: () => context.push('/receipts'),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.point_of_sale),
                title: const Text('ポイント'),
                subtitle: Text(_loading
                    ? '読み込み中...'
                    : '残高: ${_balance ?? 0} pt'),
                onTap: () => context.push('/points'),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.directions_walk),
                title: const Text('歩数・ボトル'),
                subtitle: Text(_loading
                    ? '読み込み中...'
                    : '${_fitness?.totalSteps ?? 0}歩 / ボトル${_fitness?.availableBottles ?? 0}個'),
                onTap: () => context.push('/fitness'),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.quiz),
                title: const Text('アンケート'),
                subtitle: const Text('アンケートに回答してポイント獲得'),
                onTap: () => context.push('/surveys'),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.group_add),
                title: const Text('友達紹介'),
                subtitle: const Text('友達を招待してポイントを貯めよう'),
                onTap: () => context.push('/referrals'),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.card_giftcard),
                title: const Text('キャンペーン'),
                subtitle: const Text('抽選・クエスト・ポイントキャンペーン'),
                onTap: () => context.push('/campaigns'),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.shopping_bag),
                title: const Text('ショッピング'),
                subtitle: const Text('提携EC購入でキャッシュバック'),
                onTap: () => context.push('/shopping'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
