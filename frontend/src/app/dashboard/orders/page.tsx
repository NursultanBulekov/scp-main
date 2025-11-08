'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <table className="w-full bg-gray-900"><thead><tr><th>ID</th><th>Status</th><th>Total</th></tr></thead><tbody><tr><td>#1</td><td>pending</td><td>$25.00</td></tr></tbody></table>
    </DashboardLayout>
  );
}
