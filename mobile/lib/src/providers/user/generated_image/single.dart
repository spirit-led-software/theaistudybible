import 'package:flutter/material.dart';
import 'package:revelationsai/src/models/user/generated_image.dart';
import 'package:revelationsai/src/providers/user/generated_image/repositories.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'single.g.dart';

@Riverpod(keepAlive: true)
class SingleUserGeneratedImage extends _$SingleUserGeneratedImage {
  @override
  FutureOr<UserGeneratedImage?> build(String? id) async {
    if (id == null) {
      return null;
    }

    return await ref.userGeneratedImages.get(id);
  }

  Future<void> deleteImage() async {
    try {
      final currentId = id;
      if (currentId == null) {
        throw Exception("UserGeneratedImage ID is not set");
      }

      state = const AsyncValue.data(null);
      await ref.userGeneratedImages.deleteRemote(currentId);
    } catch (error) {
      debugPrint("Failed to delete image: $error");
      refresh();
      rethrow;
    }
  }

  Future<UserGeneratedImage?> refresh() async {
    if (id == null) {
      state = const AsyncValue.data(null);
      return null;
    }
    final image = await ref.userGeneratedImages.refresh(id!);
    state = AsyncData(image);
    return image;
  }
}
