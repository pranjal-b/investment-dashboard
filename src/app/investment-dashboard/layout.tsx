export default function InvestmentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">{children}</div>
      </main>
    </div>
  );
}
