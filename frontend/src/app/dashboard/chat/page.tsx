'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConversations } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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

export default function ChatPage() {
    return (
        <div className="flex h-full items-center justify-center bg-gray-900">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-white">Select a conversation</h2>
                <p className="text-gray-400">Choose a conversation from the list to start chatting.</p>
            </div>
        </div>
    );
}
