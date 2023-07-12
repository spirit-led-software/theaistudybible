export default function LoginPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 place-items-center place-content-center bg-slate-200">
      {children}
    </div>
  );
}
