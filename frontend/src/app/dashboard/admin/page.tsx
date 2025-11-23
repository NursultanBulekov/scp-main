'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Users, Storefront, ShoppingBag } from '@phosphor-icons/react';

interface Stats {
    users: number;
    suppliers: number;
    consumers: number;
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: number, icon: React.ElementType }) => (
    <div className="bg-gray-800 p-6 rounded-lg flex items-center justify-between">
        <div>
            <p className="text-gray-400 text-sm font-semibold uppercase">{title}</p>
            <p className="text-white text-3xl font-bold">{value}</p>
        </div>
        <Icon size={48} className="text-indigo-500" />
    </div>
);

export default function AdminDashboardPage() {
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const response = await api.get('/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (err) {
                setError('Failed to fetch platform stats.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

            {isLoading ? (
                <div className="text-center text-white">Loading stats...</div>
            ) : error ? (
                <div className="text-center text-red-500">Error: {error}</div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Users" value={stats.users} icon={Users} />
                    <StatCard title="Total Suppliers" value={stats.suppliers} icon={Storefront} />
                    <StatCard title="Total Consumers" value={stats.consumers} icon={ShoppingBag} />
                </div>
            ) : (
                <div className="text-center text-white">No stats available.</div>
            )}
        </DashboardLayout>
    );
}
