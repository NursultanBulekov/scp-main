'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Create Order</h1>
      <div className="rounded bg-gray-900 p-4"><p>Apples - $4.50</p><p>Bread - $2.00</p></div>
    </DashboardLayout>
  );
}
