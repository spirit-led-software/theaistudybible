import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:revelationsai/src/models/user/request.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';

class RenameDialog extends HookConsumerWidget {
  const RenameDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    final controller = useTextEditingController(
      text: currentUser.requireValue.name,
    );
    final focusNode = useFocusNode();

    final formKey = useRef(GlobalKey<FormState>());

    final updateFuture = useState<Future?>(null);
    final updateSnapshot = useFuture(updateFuture.value);

    return AlertDialog(
      title: const Text("Edit Name"),
      content: Form(
        key: formKey.value,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (updateSnapshot.hasError) ...[
              Text(
                updateSnapshot.error.toString(),
                overflow: TextOverflow.fade,
                maxLines: 3,
                style: TextStyle(
                  color: context.colorScheme.error,
                ),
              ),
              const SizedBox(height: 10),
            ],
            TextFormField(
              controller: controller,
              focusNode: focusNode,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Please enter a name";
                }
                return null;
              },
              onFieldSubmitted: (value) {
                if (formKey.value.currentState!.validate()) {
                  focusNode.unfocus();
                }
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            if (updateSnapshot.connectionState == ConnectionState.waiting) return;
            Navigator.pop(context);
          },
          child: const Text("Cancel"),
        ),
        TextButton(
          onPressed: () async {
            if (!formKey.value.currentState!.validate()) return;
            if (updateSnapshot.connectionState == ConnectionState.waiting) return;
            focusNode.unfocus();

            updateFuture.value = ref
                .read(currentUserProvider.notifier)
                .updateUser(
                  UpdateUserRequest(
                    name: controller.text,
                  ),
                )
                .then((value) {
              Navigator.pop(context);
            });
            await updateFuture.value;
          },
          child: updateSnapshot.hasError && updateSnapshot.connectionState != ConnectionState.waiting
              ? Icon(
                  Icons.close,
                  color: context.colorScheme.error,
                )
              : updateSnapshot.connectionState == ConnectionState.waiting
                  ? CircularProgressIndicator.adaptive(
                      backgroundColor: context.colorScheme.onPrimary,
                    )
                  : const Text("Save"),
        ),
      ],
    );
  }
}
