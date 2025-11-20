'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getConversations } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

// ... (Keep existing interfaces: User, Company, Link, Conversation)
interface User {
    id: number;
    email: string;
}
interface Company {
    id: number;
    name: string;
    users: User[];
}
interface Link {
    id: number;
    supplier: Company;
    consumer: Company;
}
interface Conversation {
    id: number;
    link_id: number;
    link: Link;
}

function ConversationList() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const { user } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const data = await getConversations();
                setConversations(data);
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            }
        };

        if (user) {
            fetchConversations();
        }
    }, [user]);

    const getOtherPartyName = (conversation: Conversation) => {
        if (!user || !conversation.link) return 'Unknown';
        if (user.role.startsWith('supplier')) {
            return conversation.link.consumer.name;
        } else {
            return conversation.link.supplier.name;
        }
    };

    return (
        <div className="bg-gray-800 h-full overflow-y-auto">
            <h2 className="text-xl font-semibold p-4 text-white border-b border-gray-700">Chats</h2>
            <ul className="divide-y divide-gray-700">
                {conversations.map((conv) => {
                    const isActive = pathname === `/dashboard/chat/${conv.id}`;
                    return (
                        <li key={conv.id}>
                            <Link href={`/dashboard/chat/${conv.id}`}>
                                <div className={`p-4 cursor-pointer ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
                                                {getOtherPartyName(conv).charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {getOtherPartyName(conv)}
                                            </p>
                                            <p className="text-sm text-gray-400 truncate">
                                                Click to view chat
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="flex h-full bg-gray-900">
                <aside className="w-1/3 border-r border-gray-700">
                    <ConversationList />
                </aside>
                <main className="w-2/3">
                    {children}
                </main>
            </div>
        </DashboardLayout>
    );
}
