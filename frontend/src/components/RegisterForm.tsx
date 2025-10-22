'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('consumer');
    const [companyName, setCompanyName] = useState(''); // New state for company name
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length > 72) {
            setError('Password is too long. Max length is 72 characters.');
            return;
        }

        try {
            await api.post('/auth/register', {
                email,
                password,
                role,
                company_name: companyName, // Include company_name in the payload
            });
            router.push('/login');
        } catch (err: any) {
            if (err.response && err.response.data) {
                // Check for validation errors from FastAPI
                if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
                    const errorMessages = err.response.data.detail.map((e: any) => e.msg).join('; ');
                    setError(errorMessages);
                } else if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else {
                    setError('Failed to register: An unexpected error occurred.');
                }
            } else {
                setError('Failed to register: Network error or no response from server.');
            }
        }
    };

    const isCompanyRequired = role.startsWith('supplier') || role === 'consumer';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label
                    htmlFor="email"
                    className="block text-sm font-medium"
                >
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 p-2 block w-full rounded-md border border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                />
            </div>
            <div>
                <label
                    htmlFor="password"
                    className="block text-sm font-medium"
                >
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 p-2 block w-full rounded-md border border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <div className="flex space-x-4">
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-md border text-sm font-semibold transition-colors
                            ${role === "consumer"
                                ? "bg-indigo-600 border-indigo-600 shadow"
                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}`}
                        onClick={() => setRole("consumer")}
                    >
                        Consumer
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-md border text-sm font-semibold transition-colors
                            ${role === "supplier_owner"
                                ? "bg-indigo-600 border-indigo-600 shadow"
                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}`}
                        onClick={() => setRole("supplier_owner")}
                    >
                        Supplier Owner
                    </button>
                </div>
            </div>
            {isCompanyRequired && (
                <div>
                    <label
                        htmlFor="companyName"
                        className="block text-sm font-medium"
                    >
                        Company Name
                    </label>
                    <input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="mt-1 p-2 block w-full rounded-md border border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
                type="submit"
                className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                Register
            </button>
        </form>
    );
}
