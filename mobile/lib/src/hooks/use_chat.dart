import 'dart:convert';

import 'package:flutter/material.dart';
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
  final Function(StreamedResponse)? onResponse;
  final Function(ChatMessage)? onFinish;
  final Function(Error)? onError;

  UseChatOptions({
    required this.session,
    this.chatId,
    this.initialInput = '',
    this.initialMessages,
    this.onResponse,
    this.onFinish,
    this.onError,
  });
}

class UseChatReturnObject {
  final ValueNotifier<String?> chatId;

  final ValueNotifier<String> input;
  final TextEditingController inputController;
  final Function handleSubmit;

  final ValueNotifier<List<ChatMessage>> messages;

  final ValueNotifier<bool> loading;
  final ValueNotifier<Error?> error;

  final Function(ChatMessage) append;
  final Function reload;

  UseChatReturnObject({
    required this.chatId,
    required this.input,
    required this.inputController,
    required this.handleSubmit,
    required this.messages,
    required this.loading,
    required this.error,
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
  required ValueNotifier<List<ChatMessage>?> messages,
  required ObjectRef<List<ChatMessage>> messagesRef,
  Function(StreamedResponse)? onResponse,
  Function(ChatMessage)? onFinish,
}) async {
  List<ChatMessage> prevMessages = messagesRef.value;
  messages.value = chatRequest.messages;

  final uri = Uri.parse(API.chatUrl);
  final client = Client();
  final request = Request("POST", uri);
  request.body = jsonEncode({
    'chatId': chatRequest.chatId,
    'messages':
        chatRequest.messages.map((message) => message.toJson()).toList(),
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
    messages.value = prevMessages;
  }

  response.headers.containsKey("x-chat-id")
      ? chatId.value = response.headers["x-chat-id"]
      : chatId.value = null;

  response.headers.containsKey("x-user-message-id") &&
          Uuid.isValidUUID(fromString: response.headers["x-user-message-id"]!)
      ? chatRequest.messages.last.uuid = response.headers["x-user-message-id"]
      : chatRequest.messages.last.uuid = null;

  String? aiResponseUuid = response.headers.containsKey("x-ai-response-id") &&
          Uuid.isValidUUID(fromString: response.headers["x-ai-response-id"]!)
      ? response.headers["x-ai-response-id"]
      : null;

  final reply = ChatMessage(
    id: nanoid(),
    uuid: aiResponseUuid,
    content: '',
    role: Role.assistant,
  );

  final subscription = response.stream.transform(utf8.decoder).listen((value) {
    reply.content += value;

    messages.value = [
      ...chatRequest.messages,
      reply,
    ];
  });

  subscription.onDone(() {
    if (onFinish != null) onFinish(reply);
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

  ValueNotifier<String> input = useState(options.initialInput);
  useEffect(
    () {
      input.value = options.initialInput;
      return () {};
    },
    [options.initialInput],
  );

  ValueNotifier<List<ChatMessage>> messages =
      useState(options.initialMessages ?? []);
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

  ValueNotifier<Error?> error = useState(null);

  TextEditingController inputController =
      useTextEditingController(text: input.value);

  Function(ChatRequest) triggerRequest = useCallback(
    (ChatRequest chatRequest) async {
      try {
        loading.value = true;
        ChatMessage newMessage = await getStreamedResponse(
          chatRequest: chatRequest,
          chatId: chatId,
          messages: messages,
          messagesRef: messagesRef,
          onResponse: options.onResponse,
          onFinish: options.onFinish,
        );
        // TODO: Do something with the new message
      } on Error catch (e) {
        debugPrint(e.toString());
        error.value = e;
        if (options.onError != null) options.onError!(e);
      } finally {
        loading.value = false;
      }
    },
    [
      chatId,
      messages,
      messagesRef,
      error,
      loading,
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
      messagesRef.value,
      options.session,
      chatId.value,
    ],
  );

  Function() reload = useCallback(
    () {
      if (messagesRef.value.isEmpty) return;

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
      messagesRef.value,
      options.session,
      chatId.value,
    ],
  );

  Function() handleSubmit = useCallback(
    () {
      if (input.value == '') return;
      FocusManager.instance.primaryFocus?.unfocus();

      append(
        ChatMessage(
          id: nanoid(),
          content: input.value,
          role: Role.user,
        ),
      );

      input.value = '';
    },
    [
      input.value,
      append,
    ],
  );

  useEffect(
    () {
      input.addListener(() {
        inputController.text = input.value;
      });
      return () {
        input.removeListener(() {});
      };
    },
    [
      input,
      inputController,
    ],
  );

  useEffect(
    () {
      inputController.addListener(() {
        input.value = inputController.text;
      });
      return () {
        inputController.removeListener(() {});
      };
    },
    [
      inputController,
      input,
    ],
  );

  return UseChatReturnObject(
    chatId: chatId,
    input: input,
    inputController: inputController,
    handleSubmit: handleSubmit,
    messages: messages,
    loading: loading,
    error: error,
    append: append,
    reload: reload,
  );
}
