'use client';

import { useState } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Play } from '@phosphor-icons/react';

interface QueryResult {
    status: string;
    data?: Record<string, any>[];
    rows_affected?: number;
    error?: string;
}

export default function SqlRunnerPage() {
    const { token } = useAuth();
    const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleExecuteQuery = async () => {
        if (!token) return;
        setIsLoading(true);
        setResult(null);
        try {
            const response = await api.post('/admin/execute-sql', { query }, { // Send as JSON object
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setResult(response.data);
        } catch (err: any) {
            let errorMessage = 'An unexpected error occurred.';
            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    // Handle FastAPI validation errors
                    errorMessage = err.response.data.detail.map((e: any) => `${e.loc.join('.')} - ${e.msg}`).join('; ');
                } else if (typeof err.response.data.detail === 'string') {
                    // Handle our custom HTTPExceptions
                    errorMessage = err.response.data.detail;
                }
            }
            setResult({
                status: 'error',
                error: errorMessage
            });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderResultTable = (data: Record<string, any>[]) => {
        if (!data || data.length === 0) {
            return <p className="text-gray-400">Query executed successfully, but returned no rows.</p>;
        }
        const headers = Object.keys(data[0]);
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                        <tr>
                            {headers.map(header => <th key={header} className="p-4">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-gray-800 hover:bg-gray-800">
                                {headers.map(header => <td key={`${rowIndex}-${header}`} className="p-4">{JSON.stringify(row[header])}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold text-white mb-8">SQL Runner</h1>
            <div className="bg-gray-900 p-6 rounded-lg">
                <textarea
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                    rows={10}
                    placeholder="Enter your SQL query here..."
                />
                <button
                    onClick={handleExecuteQuery}
                    disabled={isLoading}
                    className="mt-4 flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-wait"
                >
                    <Play size={20} weight="bold" />
                    {isLoading ? 'Executing...' : 'Execute Query'}
                </button>
            </div>

            <div className="mt-8 bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Results</h2>
                {result ? (
                    <div>
                        {result.status === 'error' && <p className="text-red-500">Error: {result.error}</p>}
                        {result.status === 'success' && result.data && renderResultTable(result.data)}
                        {result.status === 'success' && result.rows_affected !== undefined && !result.data && (
                            <p className="text-green-500">Query executed successfully. Rows affected: {result.rows_affected}</p>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500">Query results will be displayed here.</p>
                )}
            </div>
        </DashboardLayout>
    );
}
