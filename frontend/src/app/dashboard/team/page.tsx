'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Team Management</h1>
      <table className="w-full bg-gray-900"><tbody><tr><td>owner@example.com</td><td>Supplier Owner</td></tr></tbody></table>
    </DashboardLayout>
  );
}
