'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Find Suppliers</h1>
      <table className="w-full bg-gray-900"><thead><tr><th>Supplier</th><th>Status</th></tr></thead><tbody><tr><td>Demo Supplier</td><td>Not linked</td></tr></tbody></table>
    </DashboardLayout>
  );
}
