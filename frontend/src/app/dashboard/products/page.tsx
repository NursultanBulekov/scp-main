'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>
      <div className="rounded bg-gray-900 p-4"><table className="w-full"><thead><tr><th>Name</th><th>Price</th><th>Stock</th></tr></thead><tbody><tr><td>Apples</td><td>$4.50</td><td>20</td></tr></tbody></table></div>
    </DashboardLayout>
  );
}
