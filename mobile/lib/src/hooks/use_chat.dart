import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:http/http.dart';
import 'package:nanoid/nanoid.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/chat/message.dart';
import 'package:uuid/uuid.dart';

class UseChatOptions {
  final String session;
  final String? chatId;
  final String initialInput;
  final List<ChatMessage>? initialMessages;
  final bool hapticFeedback;
  final Function(ChatMessage message)? onSubmit;
  final Function(StreamedResponse response)? onResponse;
  final Function(ChatMessage message)? onFinish;
  final Function(Exception error)? onError;

  UseChatOptions({
    required this.session,
    this.chatId,
    this.initialInput = '',
    this.initialMessages,
    this.hapticFeedback = true,
    this.onSubmit,
    this.onResponse,
    this.onFinish,
    this.onError,
  });
}

class UseChatReturnObject {
  final ValueNotifier<String?> chatId;

  final TextEditingController inputController;
  final FocusNode inputFocusNode;
  final Function handleSubmit;

  final ValueNotifier<List<ChatMessage>> messages;

  final ValueNotifier<bool> loading;
  final ValueNotifier<Exception?> error;

  final ValueNotifier<String?> currentResponseId;

  final Function(ChatMessage) append;
  final Function reload;

  UseChatReturnObject({
    required this.chatId,
    required this.inputController,
    required this.inputFocusNode,
    required this.handleSubmit,
    required this.messages,
    required this.loading,
    required this.error,
    required this.currentResponseId,
    required this.append,
    required this.reload,
  });
}

class ChatRequest {
  final String session;
  final String? chatId;
  final List<ChatMessage> messages;

  ChatRequest({
    required this.session,
    this.chatId,
    required this.messages,
  });
}

Function nanoid = () => customAlphabet(
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      7,
    );

Future<ChatMessage> getStreamedResponse({
  required ChatRequest chatRequest,
  required ValueNotifier<String?> chatId,
  required ValueNotifier<String?> currentResponseId,
  required ValueNotifier<List<ChatMessage>?> messages,
  bool hapticFeedback = true,
  Function(StreamedResponse)? onResponse,
  Function(ChatMessage)? onFinish,
}) async {
  messages.value = chatRequest.messages;

  var reply = ChatMessage(
    id: nanoid(),
    content: '',
    role: Role.assistant,
    chatId: chatId.value,
  );
  currentResponseId.value = reply.id;
  messages.value = [
    ...chatRequest.messages,
    reply,
  ];

  final uri = Uri.parse(API.chatUrl);
  final client = Client();
  final request = Request("POST", uri);
  request.body = jsonEncode({
    'chatId': chatRequest.chatId,
    'messages': chatRequest.messages.map((message) => message.toJson()).toList(),
  });
  request.headers.addAll(
    <String, String>{
      'Authorization': 'Bearer ${chatRequest.session}',
      'Content-Type': 'application/json',
    },
  );

  final response = await client.send(request);
  if (onResponse != null) onResponse(response);
  if (response.statusCode != 200) {
    messages.value = [
      ...chatRequest.messages,
      ChatMessage(
        id: nanoid(),
        uuid: null,
        content: "Failed to generate a response.",
        role: Role.assistant,
        chatId: chatId.value,
      ),
    ];
    final data = jsonDecode(await response.stream.transform(utf8.decoder).join());
    throw Exception(data['error'] ?? 'An unknown error occured');
  }

  response.headers.containsKey("x-chat-id") ? chatId.value = response.headers["x-chat-id"] : chatId.value = null;

  response.headers.containsKey("x-user-message-id") &&
          Uuid.isValidUUID(fromString: response.headers["x-user-message-id"]!)
      ? chatRequest.messages.last = chatRequest.messages.last.copyWith(uuid: response.headers["x-user-message-id"])
      : chatRequest.messages.last = chatRequest.messages.last.copyWith(uuid: null);

  String? aiResponseUuid = response.headers.containsKey("x-ai-response-id") &&
          Uuid.isValidUUID(fromString: response.headers["x-ai-response-id"]!)
      ? response.headers["x-ai-response-id"]
      : null;
  reply = reply.copyWith(uuid: aiResponseUuid);

  final appendFutures = <Future>[];
  final subscription = response.stream.transform(utf8.decoder).listen(
    (value) async {
      appendFutures.add(
        Future.sync(() async {
          if (appendFutures.isNotEmpty) await appendFutures.last;
          for (int i = 0; i < value.length; i++) {
            await Future.delayed(
              const Duration(milliseconds: 5),
              () {
                reply = reply.copyWith(content: "${reply.content}${value[i]}");
                messages.value = [
                  ...chatRequest.messages,
                  reply,
                ];
                if (hapticFeedback) {
                  HapticFeedback.lightImpact();
                }
              },
            );
          }
        }),
      );
    },
  );

  await subscription.asFuture().then((_) async {
    await Future.wait(appendFutures);
    appendFutures.clear();
  }).then((_) {
    if (onFinish != null) onFinish(reply);
    currentResponseId.value = null;
  }).onError((error, stackTrace) {
    messages.value = [
      ...chatRequest.messages,
      ChatMessage(
        id: nanoid(),
        uuid: aiResponseUuid,
        content: "Failed to generate a response.",
        role: Role.assistant,
        chatId: chatId.value,
      ),
    ];
    currentResponseId.value = null;
    throw error ?? Exception('An unknown error occured');
  });

  return reply;
}

UseChatReturnObject useChat({required UseChatOptions options}) {
  ValueNotifier<String?> chatId = useState(options.chatId);
  useEffect(
    () {
      chatId.value = options.chatId;
      return () {};
    },
    [options.chatId],
  );

  ValueNotifier<List<ChatMessage>> messages = useState(options.initialMessages ?? []);
  useEffect(
    () {
      messages.value = options.initialMessages ?? [];
      return () {};
    },
    [options.initialMessages],
  );

  ObjectRef<List<ChatMessage>> messagesRef = useRef(messages.value);
  useEffect(
    () {
      messagesRef.value = messages.value;
      return () {};
    },
    [messages.value],
  );

  ValueNotifier<bool> loading = useState(false);

  ValueNotifier<Exception?> error = useState(null);

  ValueNotifier<String?> currentResponseId = useState(null);

  TextEditingController inputController = useTextEditingController(text: options.initialInput);
  useEffect(
    () {
      inputController.text = options.initialInput;
      return () {};
    },
    [options.initialInput],
  );
  FocusNode inputFocusNode = useFocusNode();

  Function(ChatRequest) triggerRequest = useCallback(
    (ChatRequest chatRequest) async {
      try {
        loading.value = true;
        ChatMessage newMessage = await getStreamedResponse(
          chatRequest: chatRequest,
          chatId: chatId,
          currentResponseId: currentResponseId,
          messages: messages,
          hapticFeedback: options.hapticFeedback,
          onResponse: options.onResponse,
          onFinish: options.onFinish,
        );
        // TODO: Do something with the new message
      } on Exception catch (e) {
        debugPrint(e.toString());
        error.value = e;
        if (options.onError != null) options.onError!(e);
      } finally {
        loading.value = false;
      }
    },
    [
      chatId.value,
      messages.value,
      options.hapticFeedback,
      options.onResponse,
      options.onFinish,
      options.onError,
    ],
  );

  Function(ChatMessage) append = useCallback(
    (ChatMessage message) {
      final ChatRequest chatRequest = ChatRequest(
        session: options.session,
        chatId: chatId.value,
        messages: [...messagesRef.value, message],
      );
      triggerRequest(chatRequest);
    },
    [
      triggerRequest,
      options.session,
      chatId.value,
      messagesRef.value,
    ],
  );

  Function() reload = useCallback(
    () {
      if (options.hapticFeedback) HapticFeedback.mediumImpact();

      if (messagesRef.value.isEmpty) {
        error.value = Exception('No messages to reload');
        return;
      }

      final lastMessage = messagesRef.value.last;
      if (lastMessage.role == Role.assistant) {
        final chatRequest = ChatRequest(
          session: options.session,
          chatId: chatId.value,
          messages: messagesRef.value.sublist(0, messagesRef.value.length - 1),
        );
        return triggerRequest(chatRequest);
      }

      final chatRequest = ChatRequest(
        session: options.session,
        messages: messagesRef.value,
      );
      return triggerRequest(chatRequest);
    },
    [
      triggerRequest,
      options.session,
      chatId.value,
      messagesRef.value,
    ],
  );

  Function() handleSubmit = useCallback(
    () {
      if (options.hapticFeedback) HapticFeedback.mediumImpact();

      if (inputController.text.isEmpty) {
        error.value = Exception('Input cannot be empty');
        return;
      }
      if (inputFocusNode.hasFocus) inputFocusNode.unfocus();

      final userMessage = ChatMessage(
        id: nanoid(),
        content: inputController.text,
        role: Role.user,
        chatId: chatId.value,
      );

      if (options.onSubmit != null) options.onSubmit!(userMessage);

      append(userMessage);
      inputController.clear();
    },
    [
      options.hapticFeedback,
      options.onSubmit,
      inputController,
      inputFocusNode,
      append,
    ],
  );

  return UseChatReturnObject(
    chatId: chatId,
    inputController: inputController,
    inputFocusNode: inputFocusNode,
    handleSubmit: handleSubmit,
    messages: messages,
    loading: loading,
    error: error,
    currentResponseId: currentResponseId,
    append: append,
    reload: reload,
  );
}
