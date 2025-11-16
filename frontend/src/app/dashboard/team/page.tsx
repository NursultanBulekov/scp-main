'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamMembers, addTeamMember } from '@/lib/api';
import { RoleEnum } from '@/lib/types';

interface TeamMember {
    id: number;
    email: string;
    role: string;
    supplier_id: number;
}

export default function TeamPage() {
    const { user, token, isLoading: authLoading } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');
    const [newMemberRole, setNewMemberRole] = useState(RoleEnum.SupplierSales);

    const formatRoleName = (role: string) => {
        switch (role) {
            case RoleEnum.SupplierOwner:
                return 'Supplier Owner';
            case RoleEnum.SupplierManager:
                return 'Supplier Manager';
            case RoleEnum.SupplierSales:
                return 'Supplier Sales Representative';
            case RoleEnum.Consumer:
                return 'Consumer';
            case RoleEnum.PlatformAdmin:
                return 'Platform Admin';
            default:
                return role;
        }
    };

    useEffect(() => {
        // Wait for auth to finish loading before attempting to fetch members
        if (authLoading) {
            return;
        }

        if (user?.role === RoleEnum.SupplierOwner && token) {
            fetchMembers();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, token, authLoading]);

    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            console.log('Fetching team members for supplier_id:', user?.supplier_id);
            const response = await getTeamMembers();
            console.log('Team members response:', response);
            setMembers(response || []);
            setError('');
        } catch (error: any) {
            console.error('Error fetching team members:', error);
            setError('Failed to fetch team members.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newMemberEmail || !newMemberPassword) {
            setError('Email and password are required.');
            return;
        }

        try {
            const newMemberData = {
                email: newMemberEmail,
                password: newMemberPassword,
                role: newMemberRole,
            };
            await addTeamMember(newMemberData);
            setNewMemberEmail('');
            setNewMemberPassword('');
            fetchMembers(); // Refresh the list
        } catch (error: any) {
            setError(error.response?.data?.detail || 'Failed to add team member.');
            console.error(error);
        }
    };

    if (authLoading) {
        return (
            <DashboardLayout>
                <div className="text-center">
                    <p>Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (user?.role !== RoleEnum.SupplierOwner) {
        return (
            <DashboardLayout>
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p>Only supplier owners can manage team members.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Team Management</h1>

            {/* Add New Member Form */}
            <div className="bg-gray-900 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-bold mb-4">Add New Member</h2>
                <form onSubmit={handleAddMember}>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="bg-gray-800 p-2 rounded"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={newMemberPassword}
                            onChange={(e) => setNewMemberPassword(e.target.value)}
                            className="bg-gray-800 p-2 rounded"
                        />
                        <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as RoleEnum)}
                            className="bg-gray-800 p-2 rounded"
                        >
                            <option value={RoleEnum.SupplierManager}>Manager</option>
                            <option value={RoleEnum.SupplierSales}>Sales</option>
                        </select>
                    </div>
                    <button type="submit" className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                        Add Member
                    </button>
                </form>
            </div>

            {/* Team Members List */}
            <div className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Current Team</h2>
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400">
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members && members.length > 0 ? (
                                    members.map((member: TeamMember) => (
                                        <tr key={member.id} className="border-t border-gray-800 hover:bg-gray-800">
                                            <td className="p-2">{member.email}</td>
                                            <td className="p-2">{formatRoleName(member.role)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="p-2 text-center text-gray-400">
                                            No team members yet. Add one to get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
