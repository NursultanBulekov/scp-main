'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Manage Catalogs</h1>
      <button className="mb-4 rounded bg-indigo-600 px-4 py-2">Create Catalog</button><div className="grid grid-cols-3 gap-4"><div className="rounded bg-gray-800 p-6"><h2>Fresh food</h2><p>3 products</p></div></div>
    </DashboardLayout>
  );
}
