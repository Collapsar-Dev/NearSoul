import 'package:flutter/material.dart';
import '../../core/widgets/common.dart';

/// S35 paywall (PAY-003): benefits, price, renewal terms, restore and an always-visible close.
/// Store purchases arrive with the RevenueCat SDK; until then the purchase buttons stay disabled.
Future<void> showPaywall(BuildContext context) {
  final l = context.l;
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            Expanded(child: Text(l.paywallTitle, style: Theme.of(ctx).textTheme.titleLarge)),
            IconButton(tooltip: l.close, icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
          ]),
          const SizedBox(height: 8),
          for (final b in [l.paywallB1, l.paywallB2, l.paywallB3])
            ListTile(contentPadding: EdgeInsets.zero, leading: Icon(Icons.auto_awesome, color: Theme.of(ctx).colorScheme.secondary), title: Text(b)),
          const SizedBox(height: 8),
          FilledButton(onPressed: null, child: Text(l.paywallYearly)),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: null, child: Text(l.paywallMonthly)),
          const SizedBox(height: 8),
          Text(l.paywallSoon, textAlign: TextAlign.center, style: Theme.of(ctx).textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(l.paywallRenewal, textAlign: TextAlign.center, style: Theme.of(ctx).textTheme.bodySmall),
          TextButton(onPressed: null, child: Text(l.paywallRestore)),
        ]),
      ),
    ),
  );
}
