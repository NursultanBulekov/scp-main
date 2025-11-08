'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { CheckCircle, XCircle } from '@phosphor-icons/react';

interface Consumer {
    id: number;
    name: string;
}

interface Link {
    id: number;
    supplier_id: number;
    consumer_id: number;
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
    consumer: Consumer; // Eager loaded consumer data
}

export default function LinksPage() {
    const { token, user } = useAuth();
    const [pendingLinks, setPendingLinks] = useState<Link[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPendingLinks = async () => {
        if (!token || !user?.supplier_id) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/entities/suppliers/${user.supplier_id}/pending-links`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingLinks(response.data);
        } catch (err) {
            setError('Failed to fetch pending links.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingLinks();
    }, [token, user?.supplier_id]);

    const handleUpdateLinkStatus = async (linkId: number, status: 'accepted' | 'rejected') => {
        if (!token) return;
        try {
            await api.put(`/links/${linkId}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPendingLinks(); // Refresh the list
        } catch (err: any) {
            console.error(`Failed to ${status} link request`, err);
            alert(err.response?.data?.detail || `Failed to ${status} link request`);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Manage Link Requests</h1>
            </div>

            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                        <tr>
                            <th className="p-4">Consumer Name</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={3} className="text-center p-8">Loading pending link requests...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={3} className="text-center p-8 text-red-500">Error: {error}</td></tr>
                        ) : pendingLinks.length > 0 ? (
                            pendingLinks.map(link => (
                                <tr key={link.id} className="border-b border-gray-800 hover:bg-gray-800">
                                    <td className="p-4 font-semibold">{link.consumer.name}</td>
                                    <td className="p-4 capitalize">{link.status}</td>
                                    <td className="p-4 flex gap-2">
                                        <button
                                            onClick={() => handleUpdateLinkStatus(link.id, 'accepted')}
                                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
                                        >
                                            <CheckCircle size={16} /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleUpdateLinkStatus(link.id, 'rejected')}
                                            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={3} className="text-center p-8">No pending link requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
