import 'package:revelationsai/src/models/devotion/image.dart';
import 'package:revelationsai/src/providers/devotion/repositories.dart';
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
