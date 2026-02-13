import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/providers/auth_provider.dart';
import 'package:poi_app/screens/login_screen.dart';
import 'package:poi_app/screens/register_screen.dart';
import 'package:poi_app/screens/home_screen.dart';
import 'package:poi_app/screens/receipt_list_screen.dart';
import 'package:poi_app/screens/receipt_add_screen.dart';
import 'package:poi_app/screens/profile_screen.dart';

GoRouter router(AuthProvider authProvider) => GoRouter(
  refreshListenable: authProvider,
  initialLocation: '/',
  redirect: (context, state) {
    final auth = authProvider;
    final isAuth = auth.isAuthenticated;
    final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';
    final isRoot = state.matchedLocation == '/';

    // 未ログイン: ルート or 認証不要でないページ → ログインへ
    if (!isAuth && (isRoot || !isAuthRoute)) {
      return '/login';
    }
    // ログイン済: ルート or 認証ページ → ホームへ
    if (isAuth && (isRoot || isAuthRoute)) {
      return '/home';
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/receipts',
      builder: (context, state) => const ReceiptListScreen(),
    ),
    GoRoute(
      path: '/receipts/add',
      builder: (context, state) => const ReceiptAddScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
  ],
);
