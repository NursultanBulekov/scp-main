'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
      <div className="rounded bg-gray-900 p-4"><p>Order #1 - pending</p><button className="mr-2 bg-green-600 p-2">Accept</button><button className="bg-red-600 p-2">Reject</button></div>
    </DashboardLayout>
  );
}
