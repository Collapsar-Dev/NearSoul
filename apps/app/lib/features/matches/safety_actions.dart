import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/session.dart';
import '../../core/widgets/common.dart';

/// S38 report flow: category → comment → submit ("also block" on by default).
Future<void> reportFlow(BuildContext context, WidgetRef ref, {required String userId, required String name, String? matchId, VoidCallback? onDone}) async {
  final l = context.l;
  final cats = [
    ('harassment', l.catHarassment), ('scam', l.catScam), ('fake_profile', l.catFake), ('underage', l.catUnderage),
    ('inappropriate_photos', l.catPhotos), ('threats', l.catThreats), ('offline_behaviour', l.catOffline), ('other', l.catOther),
  ];
  String? category;
  bool alsoBlock = true;
  final comment = TextEditingController();
  final ok = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.viewInsetsOf(ctx).bottom + 20),
        child: SingleChildScrollView(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.reportTitle, style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 8),
            RadioGroup<String>(
              groupValue: category,
              onChanged: (v) => setState(() => category = v),
              child: Column(children: [for (final c in cats) RadioListTile<String>(value: c.$1, title: Text(c.$2), contentPadding: EdgeInsets.zero)]),
            ),
            TextField(controller: comment, maxLength: 500, maxLines: 3, decoration: InputDecoration(labelText: l.reportComment)),
            CheckboxListTile(value: alsoBlock, onChanged: (v) => setState(() => alsoBlock = v!), title: Text(l.reportAlsoBlock), contentPadding: EdgeInsets.zero, controlAffinity: ListTileControlAffinity.leading),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(onPressed: category == null ? null : () => Navigator.pop(ctx, true), child: Text(l.report)),
            ),
          ]),
        ),
      ),
    ),
  );
  if (ok != true || !context.mounted) return;
  try {
    await ref.read(apiProvider).post('/v1/reports-moderation', {
      'userId': userId,
      'category': category,
      if (comment.text.trim().isNotEmpty) 'comment': comment.text.trim(),
      'matchId': ?matchId,
      'alsoBlock': alsoBlock,
    });
    if (context.mounted) showSnack(context, l.reportDone);
    onDone?.call();
  } catch (e) {
    if (context.mounted) showSnack(context, errorText(context, e));
  }
}

Future<void> blockFlow(BuildContext context, WidgetRef ref, {required String userId, required String name, VoidCallback? onDone}) async {
  final l = context.l;
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      content: Text(l.blockConfirm(name)),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.cancel)), FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.block))],
    ),
  );
  if (ok != true || !context.mounted) return;
  try {
    await ref.read(apiProvider).post('/v1/blocks', {'userId': userId});
    onDone?.call();
  } catch (e) {
    if (context.mounted) showSnack(context, errorText(context, e));
  }
}
