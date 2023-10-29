import 'package:revelationsai/src/providers/chat.dart';
import 'package:revelationsai/src/providers/chat/messages.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/reaction.dart';
import 'package:revelationsai/src/providers/devotion/source_document.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'repo_initialization.g.dart';

@Riverpod(keepAlive: true)
Future<void> repoInitialization(RepoInitializationRef ref) async {
  ref.watch(currentUserProvider).requireValue;

  await ref.watch(chatManagerProvider.future);
  await ref.watch(chatMessagesManagerProvider.future);

  await ref.watch(devotionManagerProvider.future);
  await ref.watch(devotionImageManagerProvider.future);
  await ref.watch(devotionReactionManagerProvider.future);
  await ref.watch(devotionSourceDocumentManagerProvider.future);

  return;
}
