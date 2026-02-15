import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:poi_app/providers/auth_provider.dart';
import 'package:poi_app/screens/login_screen.dart';
import 'package:poi_app/screens/register_screen.dart';
import 'package:poi_app/screens/home_screen.dart';
import 'package:poi_app/screens/receipt_list_screen.dart';
import 'package:poi_app/screens/receipt_add_screen.dart';
import 'package:poi_app/screens/profile_screen.dart';
import 'package:poi_app/screens/fitness_screen.dart';
import 'package:poi_app/screens/survey_list_screen.dart';
import 'package:poi_app/screens/survey_answer_screen.dart';
import 'package:poi_app/screens/points_screen.dart';
import 'package:poi_app/screens/referral_screen.dart';
import 'package:poi_app/screens/campaign_screen.dart';
import 'package:poi_app/screens/shopping_screen.dart';

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
    GoRoute(
      path: '/fitness',
      builder: (context, state) => const FitnessScreen(),
    ),
    GoRoute(
      path: '/surveys',
      builder: (context, state) => const SurveyListScreen(),
    ),
    GoRoute(
      path: '/surveys/:id',
      builder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '0') ?? 0;
        return SurveyAnswerScreen(surveyId: id);
      },
    ),
    GoRoute(
      path: '/points',
      builder: (context, state) => const PointsScreen(),
    ),
    GoRoute(
      path: '/referrals',
      builder: (context, state) => const ReferralScreen(),
    ),
    GoRoute(
      path: '/campaigns',
      builder: (context, state) => const CampaignScreen(),
    ),
    GoRoute(
      path: '/shopping',
      builder: (context, state) => const ShoppingScreen(),
    ),
  ],
);
