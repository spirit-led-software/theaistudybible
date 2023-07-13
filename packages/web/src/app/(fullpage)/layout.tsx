export default function FullPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-[calc(100dvh)]">{children}</div>;
}
