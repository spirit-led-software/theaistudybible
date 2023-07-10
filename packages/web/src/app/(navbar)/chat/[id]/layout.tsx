export default async function SpecificChatPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <div className="flex flex-1 h-full max-w-full overflow-hidden">
      {children}
    </div>
  );
}
