export default async function DevoPageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {children}
    </div>
  );
}
