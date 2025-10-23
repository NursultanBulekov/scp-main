'use client';

import Link from 'next/link';

const links = [
  ['/dashboard', 'Dashboard'],
  ['/dashboard/products', 'Products'],
  ['/dashboard/catalogs', 'Catalogs'],
  ['/dashboard/orders', 'Orders'],
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-black text-white">
      <aside className="w-64 bg-gray-900 p-4">
        <h1 className="text-xl font-bold mb-6">SCP Corp</h1>
        <nav className="space-y-2">
          {links.map(([href, label]) => <Link className="block p-2 hover:bg-gray-800" key={href} href={href}>{label}</Link>)}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
