import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/services/receipt_service.dart';

class ReceiptListScreen extends StatefulWidget {
  const ReceiptListScreen({super.key});

  @override
  State<ReceiptListScreen> createState() => _ReceiptListScreenState();
}

class _ReceiptListScreenState extends State<ReceiptListScreen> {
  List<ReceiptModel> _receipts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ReceiptService.getReceipts();
      setState(() {
        _receipts = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('レシート'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/receipts/add').then((_) => _load()),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _load, child: const Text('再試行')),
                    ],
                  ),
                )
              : _receipts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('まだレシートがありません'),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            onPressed: () => context.push('/receipts/add').then((_) => _load()),
                            icon: const Icon(Icons.add),
                            label: const Text('レシートを登録'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        itemCount: _receipts.length,
                        itemBuilder: (context, i) {
                          final r = _receipts[i];
                          return ListTile(
                            leading: const Icon(Icons.receipt),
                            title: Text(r.storeName.isEmpty ? '店舗名なし' : r.storeName),
                            subtitle: Text('¥${r.amount.toString()} · ${r.status}'),
                            trailing: const Icon(Icons.chevron_right),
                          );
                        },
                      ),
                    ),
    );
  }
}
