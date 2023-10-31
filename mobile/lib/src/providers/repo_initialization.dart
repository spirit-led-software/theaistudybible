import 'package:revelationsai/src/providers/ai_response/repositories.dart';
import 'package:revelationsai/src/providers/chat/repositories.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'repo_initialization.g.dart';

@Riverpod(keepAlive: true)
Future<void> repositoryInitialization(RepositoryInitializationRef ref) async {
  ref.watch(currentUserProvider).requireValue;

  await ref.watch(chatRepositoryProvider.future);
  await ref.watch(chatMessagesRepositoryProvider.future);
  await ref.watch(aiResponseSourceDocumentRepositoryProvider.future);

  await ref.watch(devotionRepositoryProvider.future);
  await ref.watch(devotionImageRepositoryProvider.future);
  await ref.watch(devotionReactionRepositoryProvider.future);
  await ref.watch(devotionSourceDocumentRepositoryProvider.future);
}
