export default async function AdminPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-slate-200 place-items-center">
      {children}
    </div>
  );
}
