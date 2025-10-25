'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
    const { token, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            router.push('/login');
        }
    }, [token, router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Loading user data...
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="text-white">
                <h1 className="text-3xl font-bold mb-4">Welcome, {user.email}!</h1>
                <p className="text-lg">
                    You are logged in as a <span className="font-semibold capitalize">{user.role.replace('_', ' ')}</span>.
                </p>
                <div className="mt-8 p-6 bg-gray-900 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Your Information</h2>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    {user.supplier_id && <p><strong>Supplier ID:</strong> {user.supplier_id}</p>}
                    {user.consumer_id && <p><strong>Consumer ID:</strong> {user.consumer_id}</p>}
                </div>
            </div>
        </DashboardLayout>
    );
}
