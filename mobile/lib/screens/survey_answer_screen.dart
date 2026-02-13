import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/services/survey_service.dart';

class SurveyAnswerScreen extends StatefulWidget {
  final int surveyId;

  const SurveyAnswerScreen({super.key, required this.surveyId});

  @override
  State<SurveyAnswerScreen> createState() => _SurveyAnswerScreenState();
}

class _SurveyAnswerScreenState extends State<SurveyAnswerScreen> {
  SurveyModel? _survey;
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  final _feedbackController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final survey = await SurveyService.getSurvey(widget.surveyId);
      final answered = await SurveyService.hasAnswered(widget.surveyId);
      if (answered) {
        if (mounted) context.go('/surveys');
        return;
      }
      setState(() {
        _survey = survey;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_survey == null) return;
    setState(() => _submitting = true);
    try {
      final points = await SurveyService.submitAnswer(
        widget.surveyId,
        answers: {'feedback': _feedbackController.text},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('回答完了！$points pt を獲得しました')),
        );
        context.go('/surveys');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('アンケート回答'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/surveys'),
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
              : _survey == null
                  ? const SizedBox.shrink()
                  : SingleChildScrollView(
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
                                  Text(
                                    _survey!.title,
                                    style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  if (_survey!.description != null) ...[
                                    const SizedBox(height: 8),
                                    Text(_survey!.description!),
                                  ],
                                  const SizedBox(height: 8),
                                  Text(
                                    '${_survey!.points} pt',
                                    style: TextStyle(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .primary,
                                        fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          TextField(
                            controller: _feedbackController,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              labelText: 'ご意見・ご感想（任意）',
                              hintText: '自由にご記入ください',
                              border: OutlineInputBorder(),
                              alignLabelWithHint: true,
                            ),
                          ),
                          const SizedBox(height: 24),
                          FilledButton(
                            onPressed: _submitting ? null : _submit,
                            child: _submitting
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : const Text('回答してポイント獲得'),
                          ),
                        ],
                      ),
                    ),
    );
  }
}
