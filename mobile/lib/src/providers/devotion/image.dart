import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/devotion/image.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'image.g.dart';

@riverpod
class DevotionImages extends _$DevotionImages {
  late DevotionImageManager _manager;

  @override
  FutureOr<List<DevotionImage>> build(String devotionId) async {
    _manager = await ref.watch(devotionImageManagerProvider.future);
    return await _manager.getDevotionImagesByDevotionId(devotionId);
  }

  Future<List<DevotionImage>> refresh() async {
    final images = await _manager.refreshDevotionImagesByDevotionId(devotionId);
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

  Future<bool> _hasLocalDevotionImagesForDevotionId(String devotionId) async {
    final messages = await _isar.devotionImages.where().devotionIdEqualTo(devotionId).findAll();
    return messages.isNotEmpty;
  }

  Future<List<DevotionImage>> getDevotionImagesByDevotionId(String devotionId) async {
    if (await _hasLocalDevotionImagesForDevotionId(devotionId)) {
      return await _getLocalDevotionImagesByDevotionId(devotionId);
    }

    return await _fetchDevotionImagesByDevotionId(devotionId);
  }

  Future<List<DevotionImage>> _getLocalDevotionImagesByDevotionId(String devotionId) async {
    return await _isar.devotionImages.where().devotionIdEqualTo(devotionId).sortByCreatedAt().findAll();
  }

  Future<List<DevotionImage>> _fetchDevotionImagesByDevotionId(String devotionId) async {
    return await DevotionImageService.getDevotionImages(
      id: devotionId,
    ).then((value) async {
      await _saveDevotionImages(value.entities);
      return value.entities;
    });
  }

  Future<List<DevotionImage>> refreshDevotionImagesByDevotionId(String devotionId) async {
    return await _fetchDevotionImagesByDevotionId(devotionId);
  }

  Future<List<int>> _saveDevotionImages(List<DevotionImage> messages) async {
    return await _isar.writeTxn(() async {
      return await Future.wait(messages.map((e) async {
        return await _isar.devotionImages.put(e);
      }));
    });
  }

  Future<void> deleteLocalDevotionImagesByDevotionId(String devotionId) async {
    if (await _hasLocalDevotionImagesForDevotionId(devotionId)) {
      await _isar.writeTxn(() async {
        final messages = await _isar.devotionImages.where().devotionIdEqualTo(devotionId).findAll();
        await Future.wait(messages.map((e) async {
          await _isar.devotionImages.delete(fastHash(e.id));
        }));
      });
    }
  }
}
