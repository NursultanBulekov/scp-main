'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">SQL Runner</h1>
      <textarea className="w-full bg-gray-800 p-4" defaultValue="SELECT * FROM users;" />
    </DashboardLayout>
  );
}
