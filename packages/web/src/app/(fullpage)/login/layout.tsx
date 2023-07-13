export default function LoginPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 bg-local bg-cover place-items-center place-content-center bg-slate-200 bg-homepage lg:place-items-end lg:place-content-end">
      {children}
    </div>
  );
}
