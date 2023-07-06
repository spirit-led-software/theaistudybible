import { Sidebar } from "@components/chat";
import { prisma } from "@server/database";

async function getChats() {
  const chats = await prisma.chat.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });
  return chats;
}

export default async function ChatPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const chats = await getChats();
  return (
    <div className="flex flex-1 h-full max-w-full overflow-hidden">
      <Sidebar activeChatId={params.id} initialChats={chats} />
      {children}
    </div>
  );
}
