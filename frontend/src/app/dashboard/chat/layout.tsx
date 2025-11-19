import DashboardLayout from '@/components/DashboardLayout';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout><div className="flex h-full"><aside className="w-1/3 bg-gray-800 p-4">Chats</aside><main className="w-2/3">{children}</main></div></DashboardLayout>;
}
