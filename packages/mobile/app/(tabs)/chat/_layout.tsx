import { Chat } from "@core/database/model";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useProtectedRoute } from "@hooks/auth";
import { Message } from "@hooks/chat";
import { getChatMessages } from "@services/chat";
import { Stack, router } from "expo-router";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from "react";
import { Pressable } from "react-native";
import colors from "tailwindcss/colors";

export const ChatContext = createContext<{
  loading: boolean;
  chat: Chat | undefined;
  setChat: Dispatch<SetStateAction<Chat | undefined>>;
  chatMessages: Message[] | undefined;
}>({} as any);

export default function ChatLayout() {
  useProtectedRoute();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [chat, setChat] = useState<Chat | undefined>();
  const [chatMessages, setChatMessages] = useState<Message[] | undefined>();

  useEffect(() => {
    if (chat) {
      setLoading(true);
      getChatMessages(chat.id, user!.id, session!)
        .then((r) => {
          setChatMessages(r);
          router.push("/(tabs)/chat");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setChatMessages(undefined);
    }
  }, [chat]);

  return (
    <ChatContext.Provider
      value={{
        loading,
        chat,
        setChat,
        chatMessages,
      }}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: chat?.name || "New Chat",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.slate[700],
            },
            headerTitleStyle: {
              color: colors.white,
            },
            headerRight: () => (
              <Pressable
                className="mr-2"
                onPress={() => {
                  router.push("/(tabs)/chat/modal");
                }}
              >
                <Ionicons name="menu-outline" color={colors.white} size={20} />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            title: "Chat History",
            headerShown: false,
            presentation: "modal",
            headerTintColor: colors.white,
          }}
        />
      </Stack>
    </ChatContext.Provider>
  );
}
