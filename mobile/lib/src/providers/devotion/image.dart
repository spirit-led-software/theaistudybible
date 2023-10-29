import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'image.g.dart';

@riverpod
class DevotionImages extends _$DevotionImages {
  late String _id;

  @override
  FutureOr<List<DevotionImage>> build(String? devotionId) async {
    _id = devotionId ?? (await ref.devotions.getLatest()).id;
    return await ref.devotionImages.getByDevotionId(_id);
  }

  Future<List<DevotionImage>> refresh() async {
    final images = await ref.devotionImages.refreshByDevotionId(_id);
    state = AsyncData(images);
    return images;
  }
}

@Riverpod(keepAlive: true)
Future<DevotionImageManager> devotionImageManager(DevotionImageManagerRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  return DevotionImageManager(isar: isar);
}

class DevotionImageManager {
  final Isar _isar;

  DevotionImageManager({
    required Isar isar,
  }) : _isar = isar;

  Future<bool> _hasLocalForDevotionId(String devotionId) async {
    final messages = await _isar.devotionImages.where().devotionIdEqualTo(devotionId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<DevotionImage>> getByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      return await _getLocalByDevotionId(devotionId);
    }

    return await _fetchByDevotionId(devotionId);
  }

  Future<List<DevotionImage>> _getLocalByDevotionId(String devotionId) async {
    return await _isar.devotionImages.where().devotionIdEqualTo(devotionId).sortByCreatedAt().findAll();
  }

  Future<List<DevotionImage>> _fetchByDevotionId(String devotionId) async {
    return await DevotionImageService.getDevotionImages(
      id: devotionId,
    ).then((value) async {
      await _save(value.entities);
      return value.entities;
    });
  }

  Future<List<DevotionImage>> refreshByDevotionId(String devotionId) async {
    return await _fetchByDevotionId(devotionId);
  }

  Future<List<int>> _save(List<DevotionImage> messages) async {
    return await _isar.writeTxn(() async {
      return await _isar.devotionImages.putAll(messages);
    });
  }

  Future<void> deleteLocalByDevotionId(String devotionId) async {
    if (await _hasLocalForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final messages = await _isar.devotionImages.where().devotionIdEqualTo(devotionId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.devotionImages.delete(fastHash(e.id));
        }));
      });
    }
  }
}

extension DevotionImagesManagerX on Ref {
  DevotionImageManager get devotionImages => watch(devotionImageManagerProvider).requireValue;
}
