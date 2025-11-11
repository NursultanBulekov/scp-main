'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Create Order</h1>
      <p>Select products for this order.</p>
    </DashboardLayout>
  );
}
