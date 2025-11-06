'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Manage Link Requests</h1>
      <table className="w-full bg-gray-900"><tbody><tr><td className="p-4">School cafeteria</td><td>Pending</td></tr></tbody></table>
    </DashboardLayout>
  );
}
