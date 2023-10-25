import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:revelationsai/src/models/chat/data.dart';
import 'package:revelationsai/src/models/devotion/data.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'isar.g.dart';

@Riverpod(keepAlive: true)
Future<Isar> isarInstance(IsarInstanceRef ref) async {
  final appDir = await getApplicationDocumentsDirectory();
  return Isar.open(
    [ChatDataSchema, DevotionDataSchema],
    directory: appDir.path,
  );
}
