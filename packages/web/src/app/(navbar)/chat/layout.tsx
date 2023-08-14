export default function ChatPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {children}
    </div>
  );
}
