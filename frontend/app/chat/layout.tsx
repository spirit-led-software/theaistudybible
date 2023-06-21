import ChatSidebar from "@/components/ChatSidebar";

export default function ChatPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <ChatSidebar />
      {children}
    </div>
  );
}
