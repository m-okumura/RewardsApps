import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:poi_app/providers/auth_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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
      body: ListView(
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
              subtitle: const Text('残高: 0 pt（Phase 2で実装）'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.directions_walk),
              title: const Text('歩数'),
              subtitle: const Text('Phase 2で実装'),
            ),
          ),
        ],
      ),
    );
  }
}
