export default function AboutPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center w-full h-full overflow-hidden bg-slate-200">
      {children}
    </div>
  );
}
