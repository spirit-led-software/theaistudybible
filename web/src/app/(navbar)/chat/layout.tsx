import { Sidebar } from '@components/chat';

export default function ChatPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 h-full max-w-full overflow-hidden">
      <Sidebar />
      {children}
    </div>
  );
}
