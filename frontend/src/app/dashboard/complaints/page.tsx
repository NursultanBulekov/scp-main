'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Complaint Management</h1>
      <table className="w-full bg-gray-900"><thead><tr><th>Order</th><th>Status</th></tr></thead><tbody><tr><td>#1</td><td>Opened</td></tr></tbody></table>
    </DashboardLayout>
  );
}
