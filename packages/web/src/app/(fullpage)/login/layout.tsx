export default async function LoginPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 place-items-center place-content-center lg:place-items-end lg:place-content-end bg-gradient-to-b to-slate-600 from-slate-900">
      {children}
    </div>
  );
}
