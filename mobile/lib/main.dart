import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poi_app/providers/auth_provider.dart';
import 'package:poi_app/router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PoiApp());
}

class PoiApp extends StatelessWidget {
  const PoiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) {
        final auth = AuthProvider();
        auth.init();
        return auth;
      },
      child: Builder(
        builder: (context) {
          return MaterialApp.router(
            title: 'ポイ活アプリ',
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
              useMaterial3: true,
            ),
            routerConfig: router(context.read<AuthProvider>()),
          );
        },
      ),
    );
  }
}
