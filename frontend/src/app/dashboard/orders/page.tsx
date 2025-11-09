'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
      <div className="rounded bg-gray-900 p-4"><p>Order #1 - accepted</p><button className="mr-2 bg-blue-600 p-2">Open Chat</button><button className="bg-red-600 p-2">File Complaint</button></div>
    </DashboardLayout>
  );
}
