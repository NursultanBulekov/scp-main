'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Team Management</h1>
      <form className="mb-6 bg-gray-900 p-4"><input className="mr-2 bg-gray-800 p-2" placeholder="Email" /><button className="bg-indigo-600 p-2">Add Member</button></form><p>Current team</p>
    </DashboardLayout>
  );
}
