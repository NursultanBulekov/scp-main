'use client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-4 bg-gray-900 font-bold">SCP Dashboard</header>
      <main className="p-8">{children}</main>
    </div>
  );
}
