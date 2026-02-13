import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/services/point_service.dart';

class PointsScreen extends StatefulWidget {
  const PointsScreen({super.key});

  @override
  State<PointsScreen> createState() => _PointsScreenState();
}

class _PointsScreenState extends State<PointsScreen> {
  int? _balance;
  List<PointTransactionModel> _history = [];
  List<ExchangeOptionModel> _options = [];
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
      final balance = await PointService.getBalance();
      final history = await PointService.getHistory();
      final options = await PointService.getExchangeOptions();
      setState(() {
        _balance = balance;
        _history = history;
        _options = options;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _showExchangeDialog() {
    if (_balance == null || _balance! < 300) return;
    final amountController = TextEditingController();
    final selectedDest = <String?>[_options.isNotEmpty ? _options.first.id : null];
    final minAmount = _options.isNotEmpty ? _options.first.minAmount : 300;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('ポイント交換'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('残高: $_balance pt'),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: '交換するポイント（${minAmount}pt以上）',
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('交換先'),
                ..._options.map((o) => RadioListTile<String>(
                      title: Text('${o.name} (${o.minAmount}pt〜)'),
                      value: o.id,
                      groupValue: selectedDest[0],
                      onChanged: (v) {
                        selectedDest[0] = v;
                        setDialogState(() {});
                      },
                    )),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('キャンセル')),
            FilledButton(
              onPressed: () async {
                final amount = int.tryParse(amountController.text);
                if (amount == null ||
                    amount < minAmount ||
                    amount > (_balance ?? 0) ||
                    selectedDest[0] == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('入力内容を確認してください')),
                  );
                  return;
                }
                Navigator.pop(ctx);
                try {
                  await PointService.requestExchange(amount, selectedDest[0]!);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('$amount pt の交換を申請しました')),
                    );
                    _load();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                          content: Text(
                              e.toString().replaceFirst('Exception: ', ''))),
                    );
                  }
                }
              },
              child: const Text('交換申請'),
            ),
          ],
        ),
      ),
    );
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'receipt':
        return 'レシート';
      case 'survey':
        return 'アンケート';
      case 'bottle':
        return 'ボトル';
      case 'exchange':
        return '交換';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ポイント'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
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
                      ElevatedButton(
                          onPressed: _load, child: const Text('再試行')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              children: [
                                const Text('ポイント残高',
                                    style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey)),
                                const SizedBox(height: 8),
                                Text(
                                  '${_balance ?? 0} pt',
                                  style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold),
                                ),
                                if ((_balance ?? 0) >= 300) ...[
                                  const SizedBox(height: 16),
                                  FilledButton.icon(
                                    onPressed: _showExchangeDialog,
                                    icon: const Icon(Icons.swap_horiz),
                                    label: const Text('ポイント交換'),
                                  ),
                                ] else if (_balance != null) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    '300pt以上で交換可能',
                                    style:
                                        TextStyle(fontSize: 12, color: Colors.grey[600]),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text('履歴',
                            style:
                                TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        if (_history.isEmpty)
                          const Card(
                              child: Padding(
                                  padding: EdgeInsets.all(24),
                                  child: Center(
                                      child: Text('履歴がありません'))))
                        else
                          ..._history.map((t) => Card(
                                child: ListTile(
                                  title: Text(
                                    '${t.amount > 0 ? "+" : ""}${t.amount} pt',
                                    style: TextStyle(
                                        color: t.amount > 0
                                            ? Colors.green
                                            : Colors.grey[700],
                                        fontWeight: FontWeight.bold),
                                  ),
                                  subtitle: Text(
                                      '${_typeLabel(t.type)}${t.description != null ? " - ${t.description}" : ""}'),
                                  trailing: Text(
                                    t.createdAt.substring(0, 10),
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.grey[600]),
                                  ),
                                ),
                              )),
                      ],
                    ),
                  ),
                ),
    );
  }
}
