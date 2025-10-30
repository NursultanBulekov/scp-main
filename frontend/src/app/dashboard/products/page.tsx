'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>
      <button className="mb-4 rounded bg-indigo-600 px-4 py-2">Add Product</button><div className="rounded bg-gray-900 p-4"><input className="mr-2 bg-gray-800 p-2" placeholder="Product name" /><input className="bg-gray-800 p-2" placeholder="Price" /></div>
    </DashboardLayout>
  );
}
