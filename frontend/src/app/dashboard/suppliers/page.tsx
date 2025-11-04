'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { PaperPlaneTilt, CheckCircle, ClockCounterClockwise } from '@phosphor-icons/react';

interface Supplier {
    id: number;
    name: string;
}

interface Link {
    id: number;
    supplier_id: number;
    consumer_id: number;
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
}

export default function SuppliersPage() {
    const { token, user } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSuppliersAndLinks = async () => {
        if (!token || !user?.consumer_id) return;
        setIsLoading(true);
        try {
            const [suppliersResponse, linksResponse] = await Promise.all([
                api.get('/entities/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
                api.get(`/entities/consumers/${user.consumer_id}/links`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setSuppliers(suppliersResponse.data);
            setLinks(linksResponse.data);
        } catch (err) {
            setError('Failed to fetch suppliers or links.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliersAndLinks();
    }, [token, user?.consumer_id]);

    const handleSendLinkRequest = async (supplierId: number) => {
        if (!token) return;
        try {
            await api.post('/links/', { supplier_id: supplierId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSuppliersAndLinks(); // Refresh data
        } catch (err: any) {
            console.error("Failed to send link request", err);
            alert(err.response?.data?.detail || "Failed to send link request");
        }
    };

    const getLinkStatus = (supplierId: number) => {
        const link = links.find(l => l.supplier_id === supplierId);
        return link ? link.status : 'none';
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'pending': return <span className="flex items-center gap-1 text-yellow-500"><ClockCounterClockwise size={18} /> Pending</span>;
            case 'accepted': return <span className="flex items-center gap-1 text-green-500"><CheckCircle size={18} /> Accepted</span>;
            case 'rejected': return <span className="text-red-500">Rejected</span>;
            case 'blocked': return <span className="text-red-500">Blocked</span>;
            default: return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Find Suppliers</h1>
            </div>

            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                        <tr>
                            <th className="p-4">Supplier Name</th>
                            <th className="p-4">Link Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={3} className="text-center p-8">Loading suppliers...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={3} className="text-center p-8 text-red-500">{error}</td></tr>
                        ) : suppliers.length > 0 ? (
                            suppliers.map(supplier => {
                                const status = getLinkStatus(supplier.id);
                                return (
                                    <tr key={supplier.id} className="border-b border-gray-800 hover:bg-gray-800">
                                        <td className="p-4 font-semibold">{supplier.name}</td>
                                        <td className="p-4">{getStatusDisplay(status)}</td>
                                        <td className="p-4">
                                            {status === 'none' && (
                                                <button 
                                                    onClick={() => handleSendLinkRequest(supplier.id)}
                                                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
                                                >
                                                    <PaperPlaneTilt size={16} /> Send Link Request
                                                </button>
                                            )}
                                            {/* Add other actions based on status, e.g., "View Catalog" if accepted */}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan={3} className="text-center p-8">No suppliers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
