'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getComplaints, updateComplaint } from '@/lib/api';
import { RoleEnum } from '@/lib/types';

interface User {
    id: number;
    email: string;
    role: string;
}

interface Complaint {
    id: number;
    order_id: number;
    description: string;
    status: string;
    creator_id: number;
    handler_id: number | null;
    created_at: string;
    updated_at: string;
    creator: User;
    handler: User | null;
}

export default function ComplaintsPage() {
    const { user, token } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const formatComplaintStatus = (status: string) => {
        switch (status) {
            case 'opened':
                return 'Opened';
            case 'in_progress':
                return 'In Progress';
            case 'resolved':
                return 'Resolved';
            case 'escalated':
                return 'Escalated';
            default:
                return status;
        }
    };

    useEffect(() => {
        if (token) {
            fetchComplaints();
        }
    }, [token]);

    const fetchComplaints = async () => {
        try {
            setIsLoading(true);
            const response = await getComplaints();
            setComplaints(response || []);
            setError('');
        } catch (error: any) {
            setError('Failed to fetch complaints.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (
        complaintId: number,
        status: string,
        handlerId: number | null = null
    ) => {
        try {
            const updateData = { status, handler_id: handlerId };
            await updateComplaint(complaintId, updateData);
            fetchComplaints(); // Refresh list
        } catch (error) {
            console.error('Failed to update complaint:', error);
            alert('Failed to update complaint status.');
        }
    };

    const renderActions = (complaint: Complaint) => {
        const role = user?.role;
        const { status } = complaint;

        if (role === RoleEnum.SupplierSales) {
            return (
                <>
                    {status === 'opened' && (
                        <button
                            onClick={() =>
                                handleUpdateStatus(complaint.id, 'in_progress', user?.id || null)
                            }
                            className="text-sm bg-blue-600 px-2 py-1 rounded"
                        >
                            Take
                        </button>
                    )}
                    {status === 'in_progress' && complaint.handler_id === user?.id && (
                        <button
                            onClick={() => handleUpdateStatus(complaint.id, 'escalated')}
                            className="text-sm bg-yellow-600 px-2 py-1 rounded"
                        >
                            Escalate
                        </button>
                    )}
                </>
            );
        }
        if (role === RoleEnum.SupplierManager) {
            return (
                <>
                    {(status === 'opened' || status === 'escalated') && (
                        <button
                            onClick={() =>
                                handleUpdateStatus(complaint.id, 'in_progress', user?.id || null)
                            }
                            className="text-sm bg-blue-600 px-2 py-1 rounded"
                        >
                            Handle
                        </button>
                    )}
                    {status === 'in_progress' && complaint.handler_id === user?.id && (
                        <button
                            onClick={() => handleUpdateStatus(complaint.id, 'resolved')}
                            className="text-sm bg-green-600 px-2 py-1 rounded"
                        >
                            Resolve
                        </button>
                    )}
                </>
            );
        }
        if (role === RoleEnum.SupplierOwner) {
            // Owner can do anything, for simplicity let's allow them to resolve
            return (
                <>
                    {status !== 'resolved' && (
                        <button
                            onClick={() =>
                                handleUpdateStatus(complaint.id, 'resolved', user?.id || null)
                            }
                            className="text-sm bg-green-600 px-2 py-1 rounded"
                        >
                            Resolve
                        </button>
                    )}
                </>
            );
        }
        return null;
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Complaint Management</h1>
            <div className="bg-gray-900 p-6 rounded-lg">
                {isLoading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400">
                                <th className="p-2">Order ID</th>
                                <th className="p-2">Description</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Handler</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map((c) => (
                                <tr key={c.id} className="border-t border-gray-800">
                                    <td className="p-2">{c.order_id}</td>
                                    <td className="p-2">{c.description}</td>
                                    <td className="p-2">{formatComplaintStatus(c.status)}</td> {/* Use formatted status */}
                                    <td className="p-2">{c.handler?.email || 'Unassigned'}</td>
                                    <td className="p-2">{renderActions(c)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
