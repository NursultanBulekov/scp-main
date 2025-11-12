'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Create Order</h1>
      <div className="rounded bg-gray-900 p-4"><p>Apples - $4.50</p><div><button>-</button><span className="px-4">1</span><button>+</button></div><p className="mt-4 font-bold">Total: $4.50</p></div>
    </DashboardLayout>
  );
}
