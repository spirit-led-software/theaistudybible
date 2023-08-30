import { Text, View } from "@components/Themed";
import { Chat } from "@core/database/model";
import { Ionicons } from "@expo/vector-icons";
import { useSession, useUser } from "@hooks/auth";
import { createChat, deleteChat, getChats, updateChat } from "@services/chat";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { router } from "expo-router";
import Moment from "moment";
import { useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
} from "react-native";
import colors from "tailwindcss/colors";
import { ChatContext } from "./_layout";

export default function ChatModal() {
  const {
    loading: activeChatLoading,
    chat: activeChat,
    setChat: setActiveChat,
  } = useContext(ChatContext);
  const session = useSession();
  const { user } = useUser();
  const client = useQueryClient();
  const [editChatId, setEditChatId] = useState<string | undefined>();
  const editChatInput = useRef<TextInput>(null);
  const [newChatName, setNewChatName] = useState<string | undefined>();

  const fetchChats = async ({ pageParam = 1 }) => {
    return await getChats({
      limit: 8,
      page: pageParam,
      session: session!,
    }).then((r) => r.chats);
  };

  const {
    data,
    isInitialLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["infinite-chats"],
    queryFn: fetchChats,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 8) return undefined;
      return pages.length + 1;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      await createChat(
        {
          name: "New Chat",
        },
        { session: session! }
      ),
    onMutate: async () => {
      await client.cancelQueries(["infinite-chats"]);
      const previousChats = client.getQueryData<InfiniteData<Chat[]>>([
        "infinite-chats",
      ]);
      if (previousChats) {
        client.setQueryData<InfiniteData<Chat[]>>(["infinite-chats"], {
          pages: [
            [
              {
                id: "new-chat",
                name: "New Chat",
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: user!.id,
              },
              ...previousChats.pages[0],
            ],
            ...previousChats.pages.slice(1),
          ],
          pageParams: previousChats.pageParams,
        });
      }
      return { previousChats };
    },
    onSettled: () => {
      client.invalidateQueries(["infinite-chats"]);
    },
  });

  const editChatMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      await updateChat(
        id,
        {
          name: name,
        },
        {
          session: session!,
        }
      ),
    onMutate: async ({ name, id }) => {
      await client.cancelQueries(["infinite-chats"]);
      const previousChats = client.getQueryData<InfiniteData<Chat[]>>([
        "infinite-chats",
      ]);
      if (previousChats) {
        client.setQueryData<InfiniteData<Chat[]>>(["infinite-chats"], {
          pages: previousChats.pages.map((page) =>
            page.map((c) => (c.id === id ? { ...c, name } : c))
          ),
          pageParams: previousChats.pageParams,
        });
      }
      return { previousChats };
    },
    onSettled: () => {
      client.invalidateQueries(["infinite-chats"]);
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (id: string) =>
      await deleteChat(id, { session: session! }).finally(async () => {
        if (activeChat?.id === id) {
          setActiveChat(undefined);
          router.push("/(tabs)/chat");
        }
      }),
    onMutate: async (id: string) => {
      await client.cancelQueries(["infinite-chats"]);
      const previousChats = client.getQueryData<InfiniteData<Chat[]>>([
        "infinite-chats",
      ]);
      if (previousChats) {
        client.setQueryData<InfiniteData<Chat[]>>(["infinite-chats"], {
          pages: previousChats.pages.map((page) =>
            page.filter((c) => c.id !== id)
          ),
          pageParams: previousChats.pageParams,
        });
      }
      return { previousChats };
    },
    onSettled: async () => {
      client.invalidateQueries(["infinite-chats"]);
    },
  });

  return (
    <View className="flex flex-col w-full h-full">
      <View className="flex flex-row w-full text-center">
        <Text className="w-full py-6 text-lg text-center text-white font-catamaran-medium bg-slate-700">
          Chat History
        </Text>
      </View>
      {isInitialLoading ? (
        <View className="flex flex-col justify-center flex-1 place-items-center">
          <ActivityIndicator size={40} />
        </View>
      ) : (
        <View className="flex flex-row justify-center w-full py-3">
          <Pressable
            className="flex flex-row"
            onPress={() => {
              createMutation.mutate();
            }}
          >
            <Ionicons name="add-outline" size={20} color={colors.slate[600]} />
            <Text>Create New Chat</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={data?.pages.flat()}
        keyExtractor={(chat) => chat.id + chat.name + chat.createdAt}
        renderItem={({ item: chat }) => {
          return (
            <View
              key={chat.id}
              className="flex flex-row items-center px-3 py-3 space-x-2 border border-slate-200"
            >
              <Pressable
                className="flex flex-col flex-1 truncate"
                onPress={async () => {
                  if (editChatId === chat.id) {
                    editChatInput.current?.focus();
                    return;
                  }
                  setActiveChat(chat);
                }}
              >
                {editChatId === chat.id ? (
                  <TextInput
                    ref={editChatInput}
                    autoFocus
                    className="w-full"
                    defaultValue={chat.name}
                    onChange={(e) => setNewChatName(e.nativeEvent.text)}
                  />
                ) : (
                  <>
                    <Text className="font-catamaran-medium">{chat.name}</Text>
                    <Text className="text-gray-400">
                      {Moment(chat.createdAt).format("MM/DD/YY")}
                    </Text>
                  </>
                )}
              </Pressable>
              <View className="flex flex-row space-x-2">
                {activeChatLoading && activeChat?.id === chat.id ? (
                  <>
                    <ActivityIndicator size={30} />
                  </>
                ) : editChatId === chat.id ? (
                  <>
                    <Pressable
                      onPress={() => {
                        if (newChatName) {
                          editChatMutation.mutate({
                            id: chat.id,
                            name: newChatName!,
                          });
                          setEditChatId(undefined);
                        }
                      }}
                    >
                      <Ionicons
                        name="checkmark-sharp"
                        size={20}
                        color={colors.slate[600]}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditChatId(undefined);
                      }}
                    >
                      <Ionicons
                        name="close-outline"
                        size={20}
                        color={colors.slate[600]}
                      />
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => {
                        setEditChatId(chat.id);
                        setNewChatName(chat.name);
                      }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={colors.slate[600]}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        deleteChatMutation.mutate(chat.id);
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.slate[600]}
                      />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
      {hasNextPage && (
        <View className="flex flex-row justify-center w-full py-3">
          <Pressable
            onPress={() => fetchNextPage()}
            className="flex flex-row items-center px-3 py-3 space-x-2 border border-slate-200"
          >
            <Text className="font-catamaran-medium">Load More</Text>
            {isFetchingNextPage && <ActivityIndicator />}
          </Pressable>
        </View>
      )}
    </View>
  );
}
