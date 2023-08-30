import { Text, View } from "@components/Themed";
import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useAuth } from "@hooks/auth";
import { Message, useChat } from "@hooks/chat";
import { updateAiResponse } from "@services/ai-response";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import colors from "tailwindcss/colors";
import { ChatContext } from "./_layout";

export default function ChatScreen() {
  const { chat, chatMessages } = useContext(ChatContext);
  const { user, session } = useAuth();
  const [alert, setAlert] = useState<
    | {
        message: string;
        type: "error" | "success";
      }
    | undefined
  >();
  const [chatId, setChatId] = useState<string | undefined>(chat?.id);
  const [lastAiResponseId, setLastAiResponseId] = useState<
    string | undefined
  >();
  const [lastChatMessage, setLastChatMessage] = useState<Message | undefined>();

  const inputRef = useRef<TextInput>(null);
  const messagesRef = useRef<ScrollView>(null);

  const queryClient = useQueryClient();

  const {
    input,
    setInput,
    handleSubmit,
    messages,
    setMessages,
    error,
    isLoading,
    reload,
  } = useChat({
    chatId: chat?.id,
    initialMessages: chatMessages,
    session: session!,
    onResponse: (response) => {
      setLastAiResponseId(
        response.headers.get("x-ai-response-id") ?? undefined
      );
      setChatId(response.headers.get("x-chat-id") ?? undefined);
    },
  });

  const handleReload = useCallback(async () => {
    await reload();
    queryClient.invalidateQueries(["infinite-chats"]);
  }, [reload, session, chatId, queryClient]);

  const handleAiResponse = useCallback(
    async (chatMessage: Message) => {
      if (lastAiResponseId) {
        try {
          await updateAiResponse(
            lastAiResponseId,
            {
              aiId: chatMessage.id,
            },
            {
              session: session!,
            }
          );
        } catch (err: any) {
          setAlert({
            message: `Something went wrong: ${err.message}`,
            type: "error",
          });
        } finally {
          queryClient.invalidateQueries(["infinite-chats"]);
        }
      }
    },
    [lastAiResponseId, queryClient]
  );

  useEffect(() => {
    if (!isLoading && lastChatMessage) {
      handleAiResponse(lastChatMessage);
    }
  }, [isLoading, lastChatMessage]);

  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  useEffect(() => {
    if (chat) {
      setChatId(chat.id);
    }
  }, [chat]);

  useEffect(() => {
    if (error) {
      setAlert({
        message: error.stack ?? error.message,
        type: "error",
      });
    }
  }, [error]);

  useEffect(() => {
    if (alert) {
      console.log(alert);
      setTimeout(() => {
        setAlert(undefined);
      }, 5000);
    }
  }, [alert]);

  useEffect(() => {
    if (messagesRef.current && !isLoading) {
      messagesRef.current.scrollToEnd();
    }
  }, [messagesRef, isLoading]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollToEnd();
    }
  }, [messagesRef]);

  return (
    <View className="relative flex flex-col flex-1 w-full h-full">
      {alert && (
        <View
          className={`absolute z-50 top-0 left-0 right-0 px-4 py-2 rounded items-center ${
            alert.type === "error"
              ? "bg-red-300 border border-red-400 text-red-700"
              : "bg-green-300 border border-green-400 text-green-700"
          }`}
        >
          <Text className="text-white">{alert.message}</Text>
        </View>
      )}
      <ScrollView
        ref={messagesRef}
        className="flex flex-col flex-1 bg-white"
        contentContainerStyle={{
          alignItems: "flex-end",
          backgroundColor: colors.white,
          justifyContent: "flex-end",
          flexGrow: 1,
        }}
      >
        {messages.map((message) => (
          <View className="flex flex-row w-full px-2 py-3 border border-slate-300">
            <View
              key={message.id}
              className="flex flex-col justify-center w-10"
            >
              {message.role === "user" ? (
                <>
                  {user!.image && (
                    <Image
                      source={{
                        uri: user?.image ?? "",
                        width: 28,
                        height: 28,
                      }}
                      alt="user image"
                      className="bg-white rounded-full shadow-xl"
                    />
                  )}
                </>
              ) : (
                <View className="flex items-center justify-center w-8 h-8 border rounded-full shadow-xl bg-slate-100 border-slate-400">
                  <MaterialCommunityIcons
                    name="cross"
                    size={24}
                    color={colors.slate[800]}
                  />
                </View>
              )}
            </View>
            <View className="flex flex-row flex-1">
              <Text className="break-words whitespace-pre-wrap">
                {message.content}
              </Text>
            </View>
          </View>
        ))}
        <View className="h-16 bg-white" />
      </ScrollView>
      <View className="absolute flex flex-row items-center px-3 py-2 bg-white border rounded opacity-90 bottom-2 left-2 right-2 border-slate-200">
        <TextInput
          ref={inputRef}
          value={input}
          multiline
          placeholder="Type a message..."
          className="flex flex-row flex-1"
          onChangeText={(text) => setInput(text)}
        />
        <View className="flex flex-row items-center space-x-2">
          {isLoading ? (
            <ActivityIndicator size={28} color={colors.slate[800]} />
          ) : (
            <>
              <Pressable onPress={handleReload}>
                <FontAwesome5 name="redo" size={18} color={colors.slate[800]} />
              </Pressable>
              <Pressable onPress={handleSubmit}>
                <Feather name="send" size={24} color={colors.slate[800]} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
