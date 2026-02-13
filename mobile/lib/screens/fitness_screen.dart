import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/services/fitness_service.dart';

class FitnessScreen extends StatefulWidget {
  const FitnessScreen({super.key});

  @override
  State<FitnessScreen> createState() => _FitnessScreenState();
}

class _FitnessScreenState extends State<FitnessScreen> {
  FitnessPointsModel? _points;
  bool _loading = true;
  String? _error;
  final _stepsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _stepsController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final p = await FitnessService.getPoints();
      setState(() {
        _points = p;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _registerSteps() async {
    final steps = int.tryParse(_stepsController.text);
    if (steps == null || steps < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('正しい歩数を入力してください')),
      );
      return;
    }
    try {
      await FitnessService.registerSteps(steps);
      _stepsController.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$steps 歩を登録しました')),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  Future<void> _consumeBottles(int bottles) async {
    try {
      final result = await FitnessService.consumeBottles(bottles);
      final pts = result['points_awarded'] as int;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$bottles ボトル消費で $pts pt 獲得！')),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('歩数・ボトル'),
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
                        onPressed: _load,
                        child: const Text('再試行'),
                      ),
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
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('今日の歩数を登録',
                                    style: TextStyle(
                                        fontSize: 16, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextField(
                                        controller: _stepsController,
                                        keyboardType: TextInputType.number,
                                        decoration: const InputDecoration(
                                          hintText: '歩数',
                                          border: OutlineInputBorder(),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    FilledButton(
                                        onPressed: _registerSteps,
                                        child: const Text('登録')),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '10,000歩で1ボトル、1ボトルで10pt獲得',
                                  style: TextStyle(
                                      fontSize: 12, color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_points != null) ...[
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('ボトル状況',
                                      style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 12),
                                  _buildStatRow(
                                      '累計歩数', '${_points!.totalSteps.toString()} 歩'),
                                  _buildStatRow('利用可能ボトル',
                                      '${_points!.availableBottles} 個'),
                                  _buildStatRow(
                                      '消費済みボトル', '${_points!.consumedBottles} 個'),
                                  _buildStatRow(
                                      'ボトルから獲得', '${_points!.pointsFromBottles} pt'),
                                  _buildStatRow('ポイント残高', '${_points!.balance} pt'),
                                  if (_points!.availableBottles > 0) ...[
                                    const SizedBox(height: 16),
                                    FilledButton(
                                      onPressed: () => _showConsumeDialog(),
                                      child: const Text('ボトルを消費'),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label), Text(value, style: const TextStyle(fontWeight: FontWeight.bold))],
      ),
    );
  }

  void _showConsumeDialog() {
    if (_points == null || _points!.availableBottles <= 0) return;
    final controller = TextEditingController(text: '1');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('ボトル消費'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('利用可能: ${_points!.availableBottles} 個'),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '消費するボトル数',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('キャンセル')),
          FilledButton(
            onPressed: () {
              final n = int.tryParse(controller.text);
              Navigator.pop(ctx);
              if (n != null && n >= 1 && n <= _points!.availableBottles) {
                _consumeBottles(n);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('正しい数を入力してください')));
              }
            },
            child: const Text('消費'),
          ),
        ],
      ),
    );
  }
}
