import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/user/generated_image.dart';
import 'package:revelationsai/src/providers/user/generated_image/pages.dart';
import 'package:revelationsai/src/providers/user/generated_image/repositories.dart';
import 'package:revelationsai/src/utils/advertisement.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class CreateImageDialog extends HookConsumerWidget {
  const CreateImageDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formKey = useRef(GlobalKey<FormState>());
    final focusNode = useFocusNode();
    final controller = useTextEditingController();

    final generateFuture = useState<Future?>(null);
    final generateSnapshot = useFuture(generateFuture.value);

    return AlertDialog(
      title: const Text("Generate Image"),
      content: Form(
        key: formKey.value,
        child: TextFormField(
          controller: controller,
          focusNode: focusNode,
          minLines: 2,
          maxLines: 5,
          decoration: const InputDecoration(
            labelText: "Prompt",
            hintText: "Ex. Jesus from the book of Revelation",
          ),
          autocorrect: true,
          textCapitalization: TextCapitalization.sentences,
          keyboardType: TextInputType.multiline,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return "Please enter a prompt";
            }
            return null;
          },
          onFieldSubmitted: (value) {
            if (formKey.value.currentState!.validate()) {
              focusNode.unfocus();
            }
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            if (generateSnapshot.connectionState == ConnectionState.waiting) return;
            Navigator.of(context).pop();
          },
          child: const Text("Cancel"),
        ),
        TextButton(
          onPressed: () async {
            if (!formKey.value.currentState!.validate()) {
              return;
            }
            if (generateSnapshot.connectionState == ConnectionState.waiting) {
              return;
            }
            focusNode.unfocus();

            generateFuture.value = ref
                .read(userGeneratedImageRepositoryProvider)
                .requireValue
                .create(
                  CreateUserGeneratedImageRequest(prompt: controller.text),
                )
                .then((value) {
              context.go("/images/${value.id}");
            }).catchError((error) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    error.toString(),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: context.colorScheme.onError,
                    ),
                  ),
                  backgroundColor: context.colorScheme.error,
                ),
              );
            }).whenComplete(() {
              ref.read(userGeneratedImagesPagesProvider.notifier).refresh();
              Navigator.of(context).pop();
            });
            await showAdvertisementLogic(ref, chanceNumerator: 1);
            await generateFuture.value;
          },
          child: generateSnapshot.hasError && generateSnapshot.connectionState != ConnectionState.waiting
              ? Icon(
                  Icons.close,
                  color: context.colorScheme.error,
                )
              : generateSnapshot.connectionState == ConnectionState.waiting
                  ? CircularProgressIndicator.adaptive(
                      backgroundColor: context.colorScheme.onPrimary,
                    )
                  : const Text("Generate"),
        ),
      ],
    );
  }
}
