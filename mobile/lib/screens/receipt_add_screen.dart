import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:poi_app/services/receipt_service.dart';

class ReceiptAddScreen extends StatefulWidget {
  const ReceiptAddScreen({super.key});

  @override
  State<ReceiptAddScreen> createState() => _ReceiptAddScreenState();
}

class _ReceiptAddScreenState extends State<ReceiptAddScreen> {
  final _formKey = GlobalKey<FormState>();
  final _storeController = TextEditingController();
  final _amountController = TextEditingController();
  File? _image;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _storeController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.camera);
    if (x != null) {
      setState(() => _image = File(x.path));
    }
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;
    if (_image == null) {
      setState(() => _error = '画像を撮影してください');
      return;
    }

    final amount = int.tryParse(_amountController.text);
    if (amount == null || amount < 0) {
      setState(() => _error = '金額を正しく入力してください');
      return;
    }

    setState(() => _loading = true);
    try {
      await ReceiptService.uploadReceipt(
        _image!,
        _storeController.text.trim(),
        amount,
      );
      if (mounted) context.go('/receipts');
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('レシート登録'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                ),
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey),
                  ),
                  child: _image == null
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.camera_alt, size: 48),
                              SizedBox(height: 8),
                              Text('タップしてレシートを撮影'),
                            ],
                          ),
                        )
                      : ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(_image!, fit: BoxFit.cover),
                        ),
                ),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _storeController,
                decoration: const InputDecoration(labelText: '店舗名'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: '合計金額（円）'),
                validator: (v) {
                  if (v == null || v.isEmpty) return '入力してください';
                  final n = int.tryParse(v);
                  if (n == null || n < 0) return '正しい金額を入力してください';
                  return null;
                },
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('登録する'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
