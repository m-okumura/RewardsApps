import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/services/survey_service.dart';

class SurveyListScreen extends StatefulWidget {
  const SurveyListScreen({super.key});

  @override
  State<SurveyListScreen> createState() => _SurveyListScreenState();
}

class _SurveyListScreenState extends State<SurveyListScreen> {
  List<SurveyModel> _surveys = [];
  Map<int, bool> _answered = {};
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
      final surveys = await SurveyService.getSurveys();
      final answered = <int, bool>{};
      for (final s in surveys) {
        answered[s.id] = await SurveyService.hasAnswered(s.id);
      }
      setState(() {
        _surveys = surveys;
        _answered = answered;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('アンケート'),
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
              : _surveys.isEmpty
                  ? const Center(
                      child: Text('回答可能なアンケートはありません'),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _surveys.length,
                        itemBuilder: (context, i) {
                          final s = _surveys[i];
                          final answered = _answered[s.id] ?? false;
                          return Card(
                            child: ListTile(
                              title: Text(s.title),
                              subtitle: Text(
                                '${s.points} pt${answered ? ' ・回答済み' : ''}',
                              ),
                              trailing: answered
                                  ? const Icon(Icons.check_circle,
                                      color: Colors.green)
                                  : const Icon(Icons.chevron_right),
                              onTap: answered
                                  ? null
                                  : () => context.push('/surveys/${s.id}'),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
