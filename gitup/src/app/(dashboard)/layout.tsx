import Sidebar from "@/components/Sidebar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto flex items-center justify-center">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
