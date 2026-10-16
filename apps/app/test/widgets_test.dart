import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nearsoul/core/widgets/common.dart';
import 'package:nearsoul/core/widgets/soul_widgets.dart';
import 'package:nearsoul/l10n/gen/app_localizations.dart';

Widget wrap(Widget child, {Locale locale = const Locale('en')}) => MaterialApp(
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [AppLocalizations.delegate, GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      home: Scaffold(body: SingleChildScrollView(child: child)),
    );

void main() {
  testWidgets('tier chip shows localized tier labels', (tester) async {
    await tester.pumpWidget(wrap(const TierChip('strong')));
    expect(find.text('Strong match'), findsOneWidget);
    await tester.pumpWidget(wrap(const TierChip('good'), locale: const Locale('ru')));
    await tester.pumpAndSettle();
    expect(find.text('Хорошее совпадение'), findsOneWidget);
  });

  testWidgets('domain row renders poles, description and low-confidence hint', (tester) async {
    await tester.pumpWidget(wrap(const DomainRow(domain: {
      'name': 'Openness', 'low': 'Grounded', 'high': 'Curious', 'band': 'high', 'summary': 'You love new ideas.', 'confidence': 0.5,
    })));
    expect(find.text('Openness'), findsOneWidget);
    expect(find.text('Curious'), findsOneWidget);
    expect(find.text('You love new ideas.'), findsOneWidget);
    expect(find.text('Answer a few more questions to sharpen this.'), findsOneWidget);
  });

  testWidgets('busy button prevents double taps', (tester) async {
    var calls = 0;
    await tester.pumpWidget(wrap(BusyButton(label: 'Go', onPressed: () async {
      calls++;
      await Future<void>.delayed(const Duration(milliseconds: 100));
    })));
    await tester.tap(find.text('Go'));
    await tester.pump();
    await tester.tap(find.byType(FilledButton), warnIfMissed: false);
    await tester.pump(const Duration(milliseconds: 200));
    expect(calls, 1);
  });

  testWidgets('constellation exposes a semantic summary', (tester) async {
    await tester.pumpWidget(wrap(const Constellation(domains: [
      {'name': 'Openness', 'band': 'high', 'score': 80},
      {'name': 'Extraversion', 'band': 'low', 'score': 20},
    ])));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel(RegExp('Openness: high')), findsOneWidget);
  });
}
