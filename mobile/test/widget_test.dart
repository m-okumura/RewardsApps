// Basic smoke test for PoiApp
import 'package:flutter_test/flutter_test.dart';
import 'package:poi_app/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const PoiApp());
    await tester.pumpAndSettle();
    expect(find.byType(PoiApp), findsOneWidget);
  });
}
