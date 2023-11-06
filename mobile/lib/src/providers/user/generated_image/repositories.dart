import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:revelationsai/src/models/pagination.dart';
import 'package:revelationsai/src/models/user/generated_image.dart';
import 'package:revelationsai/src/providers/isar.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/services/user/generated_image.dart';
import 'package:revelationsai/src/utils/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'repositories.g.dart';

@Riverpod(keepAlive: true)
Future<UserGeneratedImageRepository> userGeneratedImageRepository(UserGeneratedImageRepositoryRef ref) async {
  final isar = await ref.watch(isarInstanceProvider.future);
  final session = await ref.watch(currentUserProvider.selectAsync((data) => data.session));
  return UserGeneratedImageRepository(isar, session);
}

class UserGeneratedImageRepository {
  final Isar _isar;
  final String _session;

  UserGeneratedImageRepository(Isar isar, String session)
      : _isar = isar,
        _session = session;

  Future<bool> _hasLocal(String id) async {
    final userGeneratedImage = await _isar.userGeneratedImages.get(fastHash(id));
    return userGeneratedImage != null;
  }

  Future<UserGeneratedImage?> get(String id) async {
    if (await _hasLocal(id)) {
      return await _getLocal(id);
    }
    return await _fetch(id);
  }

  Future<UserGeneratedImage?> _getLocal(String id) async {
    return await _isar.userGeneratedImages.get(fastHash(id));
  }

  Future<UserGeneratedImage> _fetch(String id) async {
    return await UserGeneratedImageService.getUserGeneratedImage(id: id, session: _session).then((value) async {
      await _save(value);
      return value;
    });
  }

  Future<UserGeneratedImage> refresh(String id) async {
    return _fetch(id);
  }

  Future<int> _save(UserGeneratedImage userGeneratedImage) async {
    return await _isar.userGeneratedImages.put(userGeneratedImage);
  }

  Future<List<int>> _saveMany(List<UserGeneratedImage> userGeneratedImages) async {
    return await _isar.userGeneratedImages.putAll(userGeneratedImages);
  }

  Future<void> deleteLocal(String id) async {
    await _isar.userGeneratedImages.delete(fastHash(id));
  }

  Future<void> deleteRemote(String id) async {
    return await UserGeneratedImageService.deleteUserGeneratedImage(id: id, session: _session).then((value) async {
      if (await _hasLocal(id)) {
        await deleteLocal(id);
      }
    });
  }

  Future<UserGeneratedImage> create(CreateUserGeneratedImageRequest request) async {
    return await UserGeneratedImageService.createUserGeneratedImage(session: _session, request: request)
        .then((value) async {
      await _save(value);
      return value;
    });
  }

  Future<List<UserGeneratedImage>> getAllLocal() async {
    return await _isar.userGeneratedImages.where().findAll();
  }

  Future<List<UserGeneratedImage>> _fetchPage(PaginatedEntitiesRequestOptions options) async {
    return await UserGeneratedImageService.getUserGeneratedImages(session: _session, paginationOptions: options)
        .then((value) async {
      await _saveMany(value.entities);
      return value.entities;
    });
  }

  Future<List<UserGeneratedImage>> getPage(PaginatedEntitiesRequestOptions options) async {
    if (await _isar.userGeneratedImages.count() >= (options.page * options.limit)) {
      return await _isar.userGeneratedImages
          .where()
          .sortByCreatedAtDesc()
          .offset((options.page - 1) * options.limit)
          .limit(options.limit)
          .findAll();
    }
    return await _fetchPage(options);
  }

  Future<List<UserGeneratedImage>> refreshPage(PaginatedEntitiesRequestOptions options) async {
    return await _fetchPage(options);
  }
}

extension UserGeneratedImageRepositoryRefX on Ref {
  UserGeneratedImageRepository get userGeneratedImages => watch(userGeneratedImageRepositoryProvider).requireValue;
}

extension UserGeneratedImageRepositoryWidgetRefX on WidgetRef {
  UserGeneratedImageRepository get userGeneratedImages => read(userGeneratedImageRepositoryProvider).requireValue;
}
