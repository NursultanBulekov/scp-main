'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Link Requests</h1>
      <p>No pending requests.</p>
    </DashboardLayout>
  );
}
