import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:revelationsai/src/models/ai_response/reaction.dart';
import 'package:revelationsai/src/models/chat.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/models/devotion/image.dart';
import 'package:revelationsai/src/models/devotion/reaction.dart';
import 'package:revelationsai/src/models/source_document.dart';
import 'package:revelationsai/src/models/user/generated_image.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'isar.g.dart';

@Riverpod(keepAlive: true)
Future<Isar> isarInstance(IsarInstanceRef ref) async {
  final appDir = await getApplicationDocumentsDirectory();
  return await Isar.open(
    [
      AiResponseReactionSchema,
      ChatSchema,
      ChatMessageSchema,
      DevotionSchema,
      DevotionImageSchema,
      DevotionReactionSchema,
      DevotionReactionCountSchema,
      StoredSourceDocumentSchema,
      UserGeneratedImageSchema,
    ],
    directory: appDir.path,
  );
}
