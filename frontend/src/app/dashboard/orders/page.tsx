'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { updateOrderStatus } from '@/lib/api';
import { Package, CheckCircle, XCircle, ChatCircleDots } from '@phosphor-icons/react';
import Modal from '@/components/Modal';
import { createComplaint } from '@/lib/api';

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number; // Price at the time of order
    product: {
        name: string;
    };
}

interface Order {
    id: number;
    supplier_id: number;
    consumer_id: number;
    status: 'pending' | 'accepted' | 'rejected' | 'shipped' | 'delivered' | 'cancelled';
    items: OrderItem[];
    created_at: string;
    updated_at: string;
    conversation_id?: number;
}

const statusColors = {
    pending: 'bg-yellow-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
    shipped: 'bg-blue-500',
    delivered: 'bg-purple-500',
    cancelled: 'bg-gray-500',
};

const OrderRow = ({
    order,
    isSupplierView,
    onUpdateStatus,
    renderCustomActions, // New prop for rendering custom actions
}: {
    order: Order;
    isSupplierView: boolean;
    onUpdateStatus: (orderId: number, status: string) => void;
    renderCustomActions?: (order: Order) => React.ReactNode; // Optional prop
}) => {
    const totalCost = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const router = useRouter();

    const handleChatClick = () => {
        if (order.conversation_id) {
            router.push(`/dashboard/chat/${order.conversation_id}`);
        }
    };

    return (
        <tr className="border-b border-gray-800 hover:bg-gray-800">
            <td className="p-4">{order.id}</td>
            <td className="p-4 capitalize">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${statusColors[order.status]}`}>
                    {order.status}
                </span>
            </td>
            <td className="p-4">
                <ul className="list-disc list-inside">
                    {order.items.map(item => (
                        <li key={item.id} className="flex items-center gap-1">
                            <Package size={16} /> {item.product.name} (x{item.quantity}) - ${item.price.toFixed(2)} each
                        </li>
                    ))}
                </ul>
            </td>
            <td className="p-4 font-semibold">${totalCost.toFixed(2)}</td>
            {isSupplierView && <td className="p-4">Consumer ID: {order.consumer_id}</td>}
            {!isSupplierView && <td className="p-4">Supplier ID: {order.supplier_id}</td>}
            <td className="p-4">
                <div className="flex items-center gap-2">
                    {order.conversation_id && (
                        <button onClick={handleChatClick} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white" title="Go to chat">
                            <ChatCircleDots size={20} />
                        </button>
                    )}
                    {/* Supplier actions */}
                    {isSupplierView && order.status === 'pending' && (
                        <>
                            <button onClick={() => onUpdateStatus(order.id, 'accepted')} className="p-2 bg-green-600 hover:bg-green-700 rounded-full text-white" title="Accept Order">
                                <CheckCircle size={20} />
                            </button>
                            <button onClick={() => onUpdateStatus(order.id, 'rejected')} className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white" title="Reject Order">
                                <XCircle size={20} />
                            </button>
                        </>
                    )}
                    {/* Consumer actions */}
                    {!isSupplierView && order.status === 'pending' && (
                        <button onClick={() => onUpdateStatus(order.id, 'cancelled')} className="p-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white" title="Cancel Order">
                            <XCircle size={20} />
                        </button>
                    )}
                    {renderCustomActions && renderCustomActions(order)}
                </div>
            </td>
        </tr>
    );
};

export default function OrdersPage() {
    const { token, user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
    const [selectedOrderForComplaint, setSelectedOrderForComplaint] = useState<Order | null>(null);
    const [complaintDescription, setComplaintDescription] = useState('');

    const isSupplier = user?.role.startsWith('supplier');

    const fetchOrders = async () => {
        if (!token || !user) {
            setError("Not authorized to view orders.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null); // Clear previous errors
        try {
            const response = await api.get('/orders/');
            setOrders(response.data);
        } catch (err) {
            setError('Failed to fetch orders.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [token, user]);

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            await updateOrderStatus(orderId, status);
            fetchOrders(); // Refresh orders list
        } catch (err: any) {
            console.error("Failed to update order status", err);
            const errorMessage = err.response?.data?.detail || "An unexpected error occurred.";
            alert(`Error: ${errorMessage}`); // Simple alert for now, can be replaced with a toast notification
        }
    };

    const handleOpenComplaintModal = (order: Order) => {
        setSelectedOrderForComplaint(order);
        setIsComplaintModalOpen(true);
    };

    const handleCloseComplaintModal = () => {
        setIsComplaintModalOpen(false);
        setSelectedOrderForComplaint(null);
        setComplaintDescription('');
    };

    const handleComplaintSubmit = async () => {
        if (!selectedOrderForComplaint || !complaintDescription || !token) return;

        try {
            await createComplaint(selectedOrderForComplaint.id, complaintDescription);
            alert('Complaint submitted successfully!');
            handleCloseComplaintModal();
        } catch (error) {
            console.error('Failed to submit complaint:', error);
            alert('Failed to submit complaint.');
        }
    };

    const renderOrderActions = (order: Order) => {

        // Add complaint button for consumers on delivered/accepted orders
        if (user?.role === 'consumer' && ['delivered', 'accepted'].includes(order.status)) {
            return (
                <button
                    onClick={() => handleOpenComplaintModal(order)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                    File Complaint
                </button>
            );
        }

        return null;
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">{isSupplier ? 'Manage Customer Orders' : 'My Orders'}</h1>
            </div>

            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                        <tr>
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Items</th>
                            <th className="p-4">Total Cost</th>
                            {isSupplier ? <th className="p-4">Consumer</th> : <th className="p-4">Supplier</th>}
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center p-8">Loading orders...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={6} className="text-center p-8 text-red-500">Error: {error}</td></tr>
                        ) : orders.length > 0 ? (
                            orders.map(order => <OrderRow key={order.id} order={order} isSupplierView={!!isSupplier} onUpdateStatus={handleUpdateStatus} renderCustomActions={renderOrderActions} />)
                        ) : (
                            <tr><td colSpan={6} className="text-center p-8">No orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Complaint Modal */}
            <Modal isOpen={isComplaintModalOpen} onClose={handleCloseComplaintModal} title="File a Complaint">
                <div className="mt-4">
                    <p className="mb-2">Filing complaint for Order ID: {selectedOrderForComplaint?.id}</p>
                    <textarea
                        value={complaintDescription}
                        onChange={(e) => setComplaintDescription(e.target.value)}
                        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
                        placeholder="Please describe the issue..."
                        rows={4}
                    ></textarea>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleComplaintSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                            Submit Complaint
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
