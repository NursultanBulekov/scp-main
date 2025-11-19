import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout><div className="flex h-full"><aside className="w-1/3 bg-gray-800 p-4"><h2>Chats</h2><Link className="mt-4 block bg-gray-700 p-3" href="/dashboard/chat/1">Demo Company</Link></aside><main className="w-2/3">{children}</main></div></DashboardLayout>;
}
