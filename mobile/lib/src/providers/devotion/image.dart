import 'package:revelationsai/src/models/devotion.dart';
import 'package:revelationsai/src/services/devotion.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'image.g.dart';

@riverpod
class DevotionImages extends _$DevotionImages {
  @override
  FutureOr<List<DevotionImage>> build(String id) {
    return DevotionImageService.getDevotionImages(id: id)
        .then((value) => value.entities);
  }
}
